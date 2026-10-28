import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateMentoringAssignmentDto, CreateMentoringMeetingDto, UpdateMentoringMeetingDto } from './mentoring.dto';

const LEADERSHIP_ROLES = ['principal','administrator','hod','coordinator'];
const ASSIGNMENT_SELECT = 'id,institution_id,department_id,faculty_user_id,student_id,academic_year,status,notes,assigned_by,created_at,updated_at,academic_students(full_name,roll_number,registration_number),departments(name,code)';
const MEETING_SELECT = 'id,assignment_id,institution_id,department_id,faculty_user_id,student_id,meeting_at,category,notes,action_plan,follow_up_on,status,created_by,created_at,updated_at';

@Controller('mentoring')
@UseGuards(SupabaseAuthGuard)
export class MentoringController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get('assignments')
  async listAssignments(@Req() request: AuthenticatedRequest, @Query('departmentId') departmentId?: string, @Query('studentId') studentId?: string, @Query('status') status?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('faculty_mentoring_assignments').select(ASSIGNMENT_SELECT)
      .order('updated_at', { ascending: false }).limit(500);
    if (departmentId) query = query.eq('department_id', departmentId);
    if (studentId) query = query.eq('student_id', studentId);
    if (status && ['active','inactive','completed'].includes(status)) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    const rows = data ?? [];
    const facultyIds = [...new Set(rows.map((row: any) => row.faculty_user_id))];
    const profileResult = facultyIds.length
      ? await client.from('profiles').select('user_id,full_name,email').in('user_id', facultyIds)
      : { data: [], error: null };
    if (profileResult.error) throw profileResult.error;
    const faculty = new Map((profileResult.data ?? []).map((row: any) => [row.user_id, { name: row.full_name, email: row.email }]));
    return rows.map((row: any) => ({ ...row, faculty: faculty.get(row.faculty_user_id) ?? null }));
  }

  @Post('assignments')
  async createAssignment(@Req() request: AuthenticatedRequest, @Body() body: CreateMentoringAssignmentDto) {
    const client = this.db.forRequest(request);
    const userId = request.authUser!.id;
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('institution_id,status').eq('user_id', userId).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new ForbiddenException('Active institutional access is required');

    const { data: roles, error: rolesError } = await client.from('role_assignments')
      .select('role,department_id').eq('user_id', userId).eq('status', 'active');
    if (rolesError) throw rolesError;
    const permitted = (roles ?? []).some((row) => LEADERSHIP_ROLES.includes(row.role));
    if (!permitted) throw new ForbiddenException('Only academic leadership can assign mentors');

    const { data: student, error: studentError } = await client.from('academic_students')
      .select('id,institution_id,department_id,status').eq('id', body.studentId).maybeSingle();
    if (studentError) throw studentError;
    if (!student || student.institution_id !== profile.institution_id || student.status !== 'active') {
      throw new BadRequestException('Choose an active student in this institution');
    }
    if (!(roles ?? []).some((row) => LEADERSHIP_ROLES.includes(row.role)
      && (!row.department_id || row.department_id === student.department_id))) {
      throw new ForbiddenException('You do not have mentoring assignment access for this department');
    }

    const { data: facultyProfile, error: facultyError } = await client.from('profiles')
      .select('user_id,institution_id,status').eq('user_id', body.facultyUserId).maybeSingle();
    if (facultyError) throw facultyError;
    if (!facultyProfile || facultyProfile.institution_id !== profile.institution_id || facultyProfile.status !== 'active') {
      throw new BadRequestException('Choose an active faculty profile in this institution');
    }
    const { data: facultyRole, error: facultyRoleError } = await client.from('role_assignments')
      .select('id').eq('user_id', body.facultyUserId).eq('role', 'faculty').eq('status', 'active')
      .eq('department_id', student.department_id).limit(1);
    if (facultyRoleError) throw facultyRoleError;
    if (!facultyRole?.length) throw new BadRequestException('The selected mentor must have an active faculty role in the student department');

    const { data, error } = await client.from('faculty_mentoring_assignments').insert({
      institution_id: profile.institution_id, department_id: student.department_id,
      faculty_user_id: body.facultyUserId, student_id: student.id,
      academic_year: body.academicYear.trim(), notes: body.notes?.trim() || null,
      assigned_by: userId, status: 'active',
    }).select(ASSIGNMENT_SELECT).single();
    if (error?.code === '23505') throw new BadRequestException('This student already has this mentor assignment for the selected academic year');
    if (error) throw error;
    return data;
  }

  @Get('assignments/:id/meetings')
  async listMeetings(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const { data, error } = await this.db.forRequest(request).from('faculty_mentoring_meetings')
      .select(MEETING_SELECT).eq('assignment_id', id).order('meeting_at', { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  }

  @Post('assignments/:id/meetings')
  async createMeeting(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: CreateMentoringMeetingDto) {
    const client = this.db.forRequest(request);
    const { data: assignment, error: assignmentError } = await client.from('faculty_mentoring_assignments')
      .select('id,institution_id,department_id,faculty_user_id,student_id,status').eq('id', id).maybeSingle();
    if (assignmentError) throw assignmentError;
    if (!assignment || assignment.status !== 'active') throw new NotFoundException('Active mentor assignment not found in your permitted scope');

    const { data, error } = await client.from('faculty_mentoring_meetings').insert({
      assignment_id: assignment.id, institution_id: assignment.institution_id,
      department_id: assignment.department_id, faculty_user_id: assignment.faculty_user_id,
      student_id: assignment.student_id, meeting_at: body.meetingAt || new Date().toISOString(),
      category: body.category, notes: body.notes.trim(), action_plan: body.actionPlan?.trim() || null,
      follow_up_on: body.followUpOn || null, status: 'open', created_by: request.authUser!.id,
    }).select(MEETING_SELECT).single();
    if (error) throw error;
    return data;
  }

  @Patch('meetings/:id')
  async updateMeeting(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateMentoringMeetingDto) {
    const client = this.db.forRequest(request);
    const { data: current, error: readError } = await client.from('faculty_mentoring_meetings')
      .select('id,status').eq('id', id).maybeSingle();
    if (readError) throw readError;
    if (!current) throw new NotFoundException('Counselling record not found in your permitted scope');
    if (body.status && body.status !== current.status) {
      const allowed = current.status === 'open' ? ['resolved'] : current.status === 'resolved' ? ['open'] : [];
      if (!allowed.includes(body.status)) throw new BadRequestException('Invalid counselling status transition');
    }
    const patch: Record<string, unknown> = {};
    if (body.status !== undefined) patch.status = body.status;
    if (body.category !== undefined) patch.category = body.category;
    if (body.notes !== undefined) patch.notes = body.notes.trim();
    if (body.actionPlan !== undefined) patch.action_plan = body.actionPlan.trim() || null;
    if (body.followUpOn !== undefined) patch.follow_up_on = body.followUpOn || null;
    if (!Object.keys(patch).length) throw new BadRequestException('No supported fields were provided');
    const { data, error } = await client.from('faculty_mentoring_meetings').update(patch)
      .eq('id', id).select(MEETING_SELECT).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Counselling record could not be updated');
    return data;
  }
}
