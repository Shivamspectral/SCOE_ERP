import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateAttendanceSessionDto, SaveAttendanceRecordsDto } from './attendance.dto';

@Controller('attendance')
@UseGuards(SupabaseAuthGuard)
export class AttendanceController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get('sessions')
  async listSessions(@Req() request: AuthenticatedRequest, @Query('classId') classId?: string, @Query('status') status?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('attendance_sessions')
      .select('id,institution_id,department_id,class_id,subject_id,faculty_user_id,session_date,session_label,academic_year,semester,lecture_no,status,submitted_at,verified_by,verified_at,created_at,updated_at')
      .order('session_date', { ascending: false }).limit(100);
    if (classId) query = query.eq('class_id', classId);
    if (status && ['draft','submitted','verified','returned'].includes(status)) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Post('sessions')
  async createSession(@Req() request: AuthenticatedRequest, @Body() body: CreateAttendanceSessionDto) {
    const client = this.db.forRequest(request);
    const { data: academicClass, error: classError } = await client.from('academic_classes')
      .select('id,institution_id,department_id,status').eq('id', body.classId).maybeSingle();
    if (classError) throw classError;
    if (!academicClass || academicClass.status !== 'active') throw new BadRequestException('Active class not found in your permitted scope');

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
}
