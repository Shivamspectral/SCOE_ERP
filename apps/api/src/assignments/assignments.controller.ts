import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateAssignmentDto, UpdateAssignmentStatusDto, UpsertAssignmentSubmissionDto } from './assignments.dto';

@Controller('assignments')
@UseGuards(SupabaseAuthGuard)
export class AssignmentsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('classId') classId?: string, @Query('status') status?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('assignment_records')
      .select('id,institution_id,department_id,class_id,subject_id,owner_user_id,title,instructions,due_at,max_marks,status,created_at,updated_at,academic_classes(name,division,academic_year),academic_subjects(name,code)')
      .order('updated_at', { ascending: false }).limit(200);
    if (classId) query = query.eq('class_id', classId);
    if (status && ['draft','published','closed','archived'].includes(status)) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: CreateAssignmentDto) {
    const client = this.db.forRequest(request);
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('institution_id,status').eq('user_id', request.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new ForbiddenException('Active institutional access is required');

    const { data: academicClass, error: classError } = await client.from('academic_classes')
      .select('id,institution_id,department_id,status').eq('id', body.classId).maybeSingle();
    if (classError) throw classError;
    if (!academicClass || academicClass.institution_id !== profile.institution_id || academicClass.status !== 'active') {
      throw new BadRequestException('Choose an active class in your institution');
    }

    if (body.subjectId) {
      const { data: subject, error } = await client.from('academic_subjects')
        .select('id,institution_id,department_id,class_id,status').eq('id', body.subjectId).maybeSingle();
      if (error) throw error;
      if (!subject || subject.institution_id !== profile.institution_id || subject.department_id !== academicClass.department_id || subject.status !== 'active' || (subject.class_id && subject.class_id !== academicClass.id)) {
        throw new BadRequestException('Subject must belong to the selected class and department');
      }
    }

    const { data, error } = await client.from('assignment_records').insert({
      institution_id: profile.institution_id,
      department_id: academicClass.department_id,
      class_id: academicClass.id,
      subject_id: body.subjectId ?? null,
      owner_user_id: request.authUser!.id,
      title: body.title.trim(),
      instructions: body.instructions?.trim() || null,
      due_at: body.dueAt ?? null,
      max_marks: body.maxMarks ?? null,
      status: 'draft',
    }).select('id,institution_id,department_id,class_id,subject_id,owner_user_id,title,instructions,due_at,max_marks,status,created_at,updated_at').single();
    if (error) {
      if (error.code === '23505') throw new ConflictException('An assignment with these details already exists');
      throw error;
    }
    return data;
  }

  @Patch(':id/status')
  async updateStatus(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateAssignmentStatusDto) {
    const client = this.db.forRequest(request);
    const { data: current, error: currentError } = await client.from('assignment_records')
      .select('id,status').eq('id', id).maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw new NotFoundException('Assignment not found or status change is not permitted');
    const transitions: Record<string, string[]> = {
      draft: ['published','archived'],
      published: ['closed','archived'],
      closed: ['published','archived'],
      archived: [],
    };
    if (current.status !== body.status && !(transitions[current.status] ?? []).includes(body.status)) {
      throw new BadRequestException(`Assignment cannot transition from ${current.status} to ${body.status}`);
    }
    const { data, error } = await client.from('assignment_records')
      .update({ status: body.status }).eq('id', id)
      .select('id,status,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Assignment not found or status change is not permitted');
    return data;
  }

  @Get(':id/submissions')
  async submissions(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const { data, error } = await this.db.forRequest(request).from('assignment_submissions')
      .select('id,assignment_id,student_id,submitted_at,submission_ref,marks,feedback,status,evaluated_by,created_at,updated_at,academic_students(full_name,roll_number,registration_number)')
      .eq('assignment_id', id).order('updated_at', { ascending: false }).limit(1000);
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Post(':id/submissions')
  async upsertSubmission(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpsertAssignmentSubmissionDto) {
    const client = this.db.forRequest(request);
    const { data: assignment, error: assignmentError } = await client.from('assignment_records')
      .select('id,institution_id,department_id,class_id,max_marks,status').eq('id', id).maybeSingle();
    if (assignmentError) throw assignmentError;
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (['closed','archived'].includes(assignment.status)) throw new BadRequestException('This assignment is closed to grading updates');

    const { data: student, error: studentError } = await client.from('academic_students')
      .select('id,institution_id,department_id,class_id,status').eq('id', body.studentId).maybeSingle();
    if (studentError) throw studentError;
    if (!student || student.institution_id !== assignment.institution_id || student.department_id !== assignment.department_id || student.class_id !== assignment.class_id || student.status !== 'active') {
      throw new BadRequestException('Choose an active student from the assignment class');
    }
    const { data: existing, error: existingError } = await client.from('assignment_submissions')
      .select('marks,feedback,submission_ref,status,submitted_at,evaluated_by')
      .eq('assignment_id', id).eq('student_id', body.studentId).maybeSingle();
    if (existingError) throw existingError;
    const nextMarks = body.marks ?? (existing?.marks == null ? null : Number(existing.marks));
    const nextStatus = body.status ?? existing?.status ?? 'pending';
    if (nextMarks !== null && assignment.max_marks !== null && nextMarks > Number(assignment.max_marks)) {
      throw new BadRequestException('Marks cannot exceed the assignment maximum');
    }
    if (nextStatus === 'evaluated' && nextMarks === null) {
      throw new BadRequestException('Enter marks before marking a submission as evaluated');
    }

    const { data, error } = await client.from('assignment_submissions').upsert({
      assignment_id: id,
      student_id: body.studentId,
      marks: nextMarks,
      feedback: body.feedback === undefined ? (existing?.feedback ?? null) : (body.feedback.trim() || null),
      submission_ref: body.submissionRef === undefined ? (existing?.submission_ref ?? null) : (body.submissionRef.trim() || null),
      status: nextStatus,
      evaluated_by: nextStatus === 'evaluated' ? request.authUser!.id : null,
      submitted_at: ['submitted','evaluated','late'].includes(nextStatus) ? (existing?.submitted_at ?? new Date().toISOString()) : null,
    }, { onConflict: 'assignment_id,student_id' })
      .select('id,assignment_id,student_id,submitted_at,submission_ref,marks,feedback,status,evaluated_by,created_at,updated_at').single();
    if (error) throw error;
    return data;
  }
}
