import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateAttendanceSessionDto, ReviewAttendanceDto, SaveAttendanceRecordsDto, UpdateAttendanceRecordDto } from './attendance.dto';

@Controller('attendance')
@UseGuards(SupabaseAuthGuard)
export class AttendanceController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get('summary')
  async summary(@Req() request: AuthenticatedRequest) {
    const client = this.db.forRequest(request);
    const countStatus = async (status: 'present' | 'absent' | 'late' | 'excused') => {
      const { count, error } = await client.from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .eq('attendance_status', status);
      if (error) throw error;
      return count ?? 0;
    };
    const [present, absent, late, excused] = await Promise.all([
      countStatus('present'), countStatus('absent'), countStatus('late'), countStatus('excused'),
    ]);
    const total = present + absent + late + excused;
    return {
      totalRecords: total,
      present,
      absent,
      late,
      excused,
      attendanceRatePercent: total ? Math.round(((present + late) / total) * 1000) / 10 : null,
    };
  }

  @Get('sessions')
  async listSessions(@Req() request: AuthenticatedRequest, @Query('classId') classId?: string, @Query('status') status?: string, @Query('from') from?: string, @Query('to') to?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('attendance_sessions')
      .select('id,institution_id,department_id,class_id,subject_id,faculty_user_id,session_date,session_label,academic_year,semester,lecture_no,status,submitted_at,verified_by,verified_at,review_note,created_at,updated_at,departments(name,code),academic_classes(name,division),academic_subjects(name,code)')
      .order('session_date', { ascending: false }).limit(100);
    if (classId) query = query.eq('class_id', classId);
    if (status && ['draft','submitted','verified','returned'].includes(status)) query = query.eq('status', status);
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) query = query.gte('session_date', from);
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) query = query.lte('session_date', to);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Get('class/:classId')
  async byClass(@Req() request: AuthenticatedRequest, @Param('classId', new ParseUUIDPipe()) classId: string) {
    const client = this.db.forRequest(request);
    const { data, error } = await client.from('attendance_sessions')
      .select('id,class_id,subject_id,faculty_user_id,session_date,session_label,status,submitted_at,verified_by,verified_at,review_note,created_at')
      .eq('class_id', classId).order('session_date', { ascending: false }).limit(200);
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Get('student/:studentId')
  async byStudent(@Req() request: AuthenticatedRequest, @Param('studentId', new ParseUUIDPipe()) studentId: string) {
    const client = this.db.forRequest(request);
    const { data, error } = await client.from('attendance_records')
      .select('id,session_id,student_id,attendance_status,note,recorded_by,created_at,attendance_sessions(session_date,session_label,subject,status)')
      .eq('student_id', studentId).order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Get('sessions/:id/records')
  async getRecords(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const client = this.db.forRequest(request);
    const { data, error } = await client.from('attendance_records')
      .select('id,session_id,student_id,attendance_status,note,recorded_by,created_at,academic_students(roll_number,registration_number,full_name)')
      .eq('session_id', id).order('created_at', { ascending: true }).limit(500);
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Patch('records/:id')
  async updateRecord(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateAttendanceRecordDto) {
    const client = this.db.forRequest(request);
    // Attendance becomes immutable once submitted for review. Checking only
    // recorded_by would otherwise let a session owner rewrite verified records.
    const { data: existing, error: existingError } = await client.from('attendance_records')
      .select('id,recorded_by,attendance_sessions(status,faculty_user_id)')
      .eq('id', id).maybeSingle();
    if (existingError) throw existingError;
    if (!existing) throw new NotFoundException('Attendance record not found or correction is not permitted');
    const parent = Array.isArray(existing.attendance_sessions) ? existing.attendance_sessions[0] : existing.attendance_sessions;
    if (existing.recorded_by !== request.authUser!.id || parent?.faculty_user_id !== request.authUser!.id) {
      throw new NotFoundException('Attendance record not found or correction is not permitted');
    }
    if (!parent || !['draft', 'returned'].includes(parent.status)) {
      throw new BadRequestException('Attendance can only be corrected while its session is a draft or returned');
    }
    const patch: Record<string, unknown> = {};
    if (body.status !== undefined) patch.attendance_status = body.status;
    if (body.note !== undefined) patch.note = body.note.trim() || null;
    if (!Object.keys(patch).length) throw new BadRequestException('No supported attendance fields were provided');
    const { data, error } = await client.from('attendance_records').update(patch)
      .eq('id', id).eq('recorded_by', request.authUser!.id)
      .select('id,session_id,student_id,attendance_status,note,recorded_by,created_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Attendance record not found or correction is not permitted');
    return data;
  }

  @Post('sessions')
  async createSession(@Req() request: AuthenticatedRequest, @Body() body: CreateAttendanceSessionDto) {
    const client = this.db.forRequest(request);
    const { data: academicClass, error: classError } = await client.from('academic_classes')
      .select('id,institution_id,department_id,status').eq('id', body.classId).maybeSingle();
    if (classError) throw classError;
    if (!academicClass || academicClass.status !== 'active') throw new BadRequestException('Active class not found in your permitted scope');

    const { data: profile, error: profileError } = await client.from('profiles')
      .select('institution_id,status').eq('user_id', request.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active' || profile.institution_id !== academicClass.institution_id) {
      throw new ForbiddenException('Active institutional access is required');
    }
    const { data: roles, error: roleError } = await client.from('role_assignments')
      .select('role,department_id').eq('user_id', request.authUser!.id).eq('status', 'active');
    if (roleError) throw roleError;
    const canCreateAttendance = (roles ?? []).some((role) =>
      ['faculty', 'hod', 'coordinator'].includes(role.role)
      && (role.department_id === null || role.department_id === academicClass.department_id));
    if (!canCreateAttendance) {
      throw new ForbiddenException('Attendance sessions require an authorized academic role in this department');
    }

    if (body.subjectId) {
      const { data: subject, error: subjectError } = await client.from('academic_subjects')
        .select('id,department_id,class_id,status').eq('id', body.subjectId).maybeSingle();
      if (subjectError) throw subjectError;
      if (!subject || subject.status !== 'active' || subject.department_id !== academicClass.department_id || (subject.class_id && subject.class_id !== academicClass.id)) {
        throw new BadRequestException('Subject is not active in the selected class department');
      }
    }

    const { data, error } = await client.from('attendance_sessions').insert({
      institution_id: academicClass.institution_id,
      department_id: academicClass.department_id,
      class_id: academicClass.id,
      subject_id: body.subjectId ?? null,
      faculty_user_id: request.authUser!.id,
      session_date: body.sessionDate ?? new Date().toISOString().slice(0, 10),
      session_label: body.sessionLabel ?? null,
      academic_year: body.academicYear ?? null,
      semester: body.semester ?? null,
      lecture_no: body.lectureNo ?? null,
      status: 'draft',
    }).select('id,class_id,subject_id,session_date,session_label,status,created_at').single();
    if (error) throw error;
    return data;
  }

  @Post('sessions/:id/records')
  async saveRecords(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: SaveAttendanceRecordsDto,
  ) {
    const client = this.db.forRequest(request);
    const { data: session, error: sessionError } = await client.from('attendance_sessions')
      .select('id,institution_id,department_id,class_id,faculty_user_id,status')
      .eq('id', id).maybeSingle();
    if (sessionError) throw sessionError;
    if (!session || session.faculty_user_id !== request.authUser!.id || !['draft','returned'].includes(session.status)) {
      throw new BadRequestException('Attendance session is not editable by this account');
    }

    const studentIds = body.records.map((record) => record.studentId);
    const { data: students, error: studentsError } = await client.from('academic_students')
      .select('id,class_id,department_id,status').in('id', studentIds);
    if (studentsError) throw studentsError;
    const allowed = new Set((students ?? [])
      .filter((student) => student.class_id === session.class_id && student.department_id === session.department_id && student.status === 'active')
      .map((student) => student.id));
    if (allowed.size !== studentIds.length || studentIds.some((studentId) => !allowed.has(studentId))) {
      throw new BadRequestException('Every attendance record must reference an active student in this class');
    }

    const rows = body.records.map((record) => ({
      session_id: session.id,
      institution_id: session.institution_id,
      department_id: session.department_id,
      student_id: record.studentId,
      attendance_status: record.status,
      note: record.note ?? null,
      recorded_by: request.authUser!.id,
    }));
    const { data, error } = await client.from('attendance_records')
      .upsert(rows, { onConflict: 'session_id,student_id' })
      .select('id,session_id,student_id,attendance_status,note,recorded_by,created_at');
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Post('sessions/:id/submit')
  async submitSession(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const client = this.db.forRequest(request);
    const { data: session, error: sessionError } = await client.from('attendance_sessions')
      .select('id,institution_id,department_id,class_id,faculty_user_id,status')
      .eq('id', id).maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) throw new NotFoundException('Attendance session not found');
    if (session.faculty_user_id !== request.authUser!.id || !['draft', 'returned'].includes(session.status)) {
      throw new ForbiddenException('Only the session owner can submit a draft or returned attendance session');
    }

    const { data: students, error: studentsError } = await client.from('academic_students')
      .select('id').eq('class_id', session.class_id).eq('department_id', session.department_id)
      .eq('status', 'active').limit(1000);
    if (studentsError) throw studentsError;
    if (!students?.length) throw new BadRequestException('There are no active students in this class');

    const { data: records, error: recordsError } = await client.from('attendance_records')
      .select('student_id').eq('session_id', session.id).limit(1000);
    if (recordsError) throw recordsError;
    const recordedIds = new Set((records ?? []).map((record) => record.student_id));
    const missingCount = students.filter((student) => !recordedIds.has(student.id)).length;
    if (missingCount) throw new BadRequestException(`Attendance is incomplete: ${missingCount} active student(s) still need a record`);

    const { data, error } = await client.from('attendance_sessions').update({
      status: 'submitted', submitted_at: new Date().toISOString(), review_note: null,
    }).eq('id', session.id).select('id,status,submitted_at,review_note,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Attendance session could not be submitted');
    return data;
  }

  @Post('sessions/:id/review')
  async reviewSession(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ReviewAttendanceDto,
  ) {
    const client = this.db.forRequest(request);
    const { data: session, error: sessionError } = await client.from('attendance_sessions')
      .select('id,department_id,status').eq('id', id).maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) throw new NotFoundException('Attendance session not found');

    const { data: roles, error: rolesError } = await client.from('role_assignments')
      .select('role,department_id').eq('user_id', request.authUser!.id).eq('status', 'active');
    if (rolesError) throw rolesError;
    const canReview = (roles ?? []).some((assignment) =>
      ['principal', 'administrator'].includes(assignment.role)
      || (['hod', 'coordinator'].includes(assignment.role) && assignment.department_id === session.department_id),
    );
    if (!canReview) throw new ForbiddenException('Only the Principal, administrator, or department leadership can review attendance');
    if (session.status !== 'submitted') throw new BadRequestException('Only submitted attendance sessions can be reviewed');
    if (body.decision === 'returned' && !body.reason?.trim()) {
      throw new BadRequestException('A correction reason is required when returning attendance');
    }

    const verified = body.decision === 'verified';
    const { data, error } = await client.from('attendance_sessions').update({
      status: body.decision,
      verified_by: verified ? request.authUser!.id : null,
      verified_at: verified ? new Date().toISOString() : null,
      review_note: verified ? null : body.reason!.trim(),
    }).eq('id', session.id).select('id,status,verified_by,verified_at,review_note,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Attendance session could not be reviewed');
    return data;
  }

}
