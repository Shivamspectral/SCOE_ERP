import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateMarksRecordDto, MarkLockDto, UpdateMarksRecordDto } from './marks.dto';

@Controller('marks')
@UseGuards(SupabaseAuthGuard)
export class MarksController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('classId') classId?: string, @Query('subjectId') subjectId?: string, @Query('assessmentName') assessmentName?: string, @Query('status') status?: string, @Query('limit') rawLimit?: string) {
    const client = this.db.forRequest(request);
    const limit = Math.min(300, Math.max(1, Number.parseInt(rawLimit ?? '100', 10) || 100));
    let query = client.from('marks_records')
      .select('id,institution_id,department_id,class_id,subject_id,student_id,faculty_user_id,assessment_name,max_marks,marks_obtained,status,verified_by,verified_at,feedback,created_at,updated_at,academic_students(full_name,roll_number,registration_number),academic_classes(name,academic_year,division),academic_subjects(name,code)')
      .order('updated_at', { ascending: false }).limit(limit);
    if (classId) query = query.eq('class_id', classId);
    if (subjectId) query = query.eq('subject_id', subjectId);
    if (assessmentName) query = query.eq('assessment_name', assessmentName);
    if (status && ['draft','submitted','verified','returned','locked'].includes(status)) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Get(':id')
  async get(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const { data, error } = await this.db.forRequest(request).from('marks_records')
      .select('id,institution_id,department_id,class_id,subject_id,student_id,faculty_user_id,assessment_name,max_marks,marks_obtained,status,verified_by,verified_at,feedback,created_at,updated_at,academic_students(full_name,roll_number,registration_number),academic_classes(name,academic_year,division),academic_subjects(name,code)')
      .eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Marks record not found');
    return data;
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: CreateMarksRecordDto) {
    if (body.marksObtained !== undefined && body.marksObtained > body.maxMarks) throw new BadRequestException('Marks obtained cannot exceed maximum marks');
    const client = this.db.forRequest(request);
    const { data: profile, error: profileError } = await client.from('profiles').select('institution_id,status').eq('user_id', request.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new ForbiddenException('Active institutional access is required');
    const { data: student, error: studentError } = await client.from('academic_students').select('id,institution_id,department_id,class_id,status').eq('id', body.studentId).maybeSingle();
    if (studentError) throw studentError;
    if (!student || student.institution_id !== profile.institution_id || student.status !== 'active') throw new BadRequestException('Marks must reference an active student in this institution');
    const classId = body.classId ?? student.class_id;
    if (classId && student.class_id !== classId) throw new BadRequestException('Student does not belong to the selected class');
    if (body.subjectId) {
      const { data: subject, error } = await client.from('academic_subjects').select('id,institution_id,department_id,class_id,status').eq('id', body.subjectId).maybeSingle();
      if (error) throw error;
      if (!subject || subject.institution_id !== profile.institution_id || subject.department_id !== student.department_id || subject.status !== 'active' || (subject.class_id && subject.class_id !== classId)) throw new BadRequestException('Subject does not belong to the selected class and department');
    }
    const { data, error } = await client.from('marks_records').insert({
      institution_id: profile.institution_id, department_id: student.department_id, class_id: classId ?? null,
      subject_id: body.subjectId ?? null, student_id: student.id, faculty_user_id: request.authUser!.id,
      assessment_name: body.assessmentName.trim(), max_marks: body.maxMarks,
      marks_obtained: body.marksObtained ?? null, status: 'draft',
    }).select('id,institution_id,department_id,class_id,subject_id,student_id,faculty_user_id,assessment_name,max_marks,marks_obtained,status,created_at,updated_at').single();
    if (error) throw error;
    return data;
  }

  @Patch()
  async update(@Req() request: AuthenticatedRequest, @Body() body: UpdateMarksRecordDto) {
    const client = this.db.forRequest(request);
    const { data: existing, error: readError } = await client.from('marks_records').select('id,max_marks,status').eq('id', body.id).maybeSingle();
    if (readError) throw readError;
    if (!existing) throw new NotFoundException('Marks record not found or not accessible');
    if (['locked','verified'].includes(existing.status)) throw new BadRequestException('Verified or locked marks cannot be edited');
    if (body.marksObtained !== undefined && body.marksObtained > Number(existing.max_marks)) throw new BadRequestException('Marks obtained cannot exceed maximum marks');
    const patch: Record<string, unknown> = {};
    if (body.marksObtained !== undefined) patch.marks_obtained = body.marksObtained;
    if (body.feedback !== undefined) patch.feedback = body.feedback.trim() || null;
    if (!Object.keys(patch).length) throw new BadRequestException('No supported fields were provided');
    const { data, error } = await client.from('marks_records').update(patch).eq('id', body.id).select('id,assessment_name,max_marks,marks_obtained,status,feedback,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Marks record not found or update is not permitted');
    return data;
  }

  private async assertAcademicApprover(request: AuthenticatedRequest, departmentId: string) {
    const client = this.db.forRequest(request);
    const { data: roles, error } = await client.from('role_assignments').select('role,department_id').eq('user_id', request.authUser!.id).eq('status', 'active');
    if (error) throw error;
    const allowed = (roles ?? []).some((row) => ['principal','administrator'].includes(row.role) || (['hod','coordinator'].includes(row.role) && (!row.department_id || row.department_id === departmentId)));
    if (!allowed) throw new ForbiddenException('Only an academic approver can lock or unlock marks');
  }

  @Post(':id/lock')
  async lock(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: MarkLockDto) {
    const client = this.db.forRequest(request);
    const { data: record, error: readError } = await client.from('marks_records').select('id,department_id,status').eq('id', id).maybeSingle();
    if (readError) throw readError;
    if (!record) throw new NotFoundException('Marks record not found');
    await this.assertAcademicApprover(request, record.department_id);
    if (record.status === 'locked') throw new BadRequestException('Marks are already locked');
    const { data, error } = await client.from('marks_records').update({ status: 'locked', feedback: body.reason?.trim() || null }).eq('id', id).select('id,status,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Marks record could not be locked');
    return data;
  }

  @Post(':id/unlock')
  async unlock(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: MarkLockDto) {
    const client = this.db.forRequest(request);
    const { data: record, error: readError } = await client.from('marks_records').select('id,department_id,status').eq('id', id).maybeSingle();
    if (readError) throw readError;
    if (!record) throw new NotFoundException('Marks record not found');
    await this.assertAcademicApprover(request, record.department_id);
    if (record.status !== 'locked') throw new BadRequestException('Only locked marks can be unlocked');
    const { data, error } = await client.from('marks_records').update({ status: 'draft', feedback: body.reason?.trim() || null }).eq('id', id).select('id,status,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Marks record could not be unlocked');
    return data;
  }
}
