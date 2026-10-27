import { BadRequestException, ConflictException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateSyllabusProgressDto, CreateTimetableEntryDto, UpdateSyllabusProgressDto } from './academic.dto';

@Controller('academic')
@UseGuards(SupabaseAuthGuard)
export class AcademicController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get('classes')
  async classes(@Req() request: AuthenticatedRequest, @Query('departmentId') departmentId?: string, @Query('status') status?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('academic_classes')
      .select('id,institution_id,department_id,name,academic_year,year_of_study,division,program_level,status,created_at,updated_at,departments(name,code)')
      .order('name', { ascending: true }).limit(200);
    if (departmentId) query = query.eq('department_id', departmentId);
    if (status && ['active','archived'].includes(status)) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Get('subjects')
  async subjects(@Req() request: AuthenticatedRequest, @Query('classId') classId?: string, @Query('departmentId') departmentId?: string, @Query('status') status?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('academic_subjects')
      .select('id,institution_id,department_id,class_id,code,name,semester,credits,status,created_at,updated_at,departments(name,code),academic_classes(name,year_of_study,division,academic_year)')
      .order('name', { ascending: true }).limit(300);
    if (classId) query = query.eq('class_id', classId);
    if (departmentId) query = query.eq('department_id', departmentId);
    if (status && ['active','archived'].includes(status)) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Get('timetable')
  async timetable(@Req() request: AuthenticatedRequest, @Query('departmentId') departmentId?: string, @Query('dayOfWeek') rawDay?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('timetable_entries')
      .select('id,institution_id,department_id,faculty_id,subject,cohort,room,day_of_week,starts_at,ends_at,status,created_by,created_at,updated_at,departments(name,code)')
      .eq('status', 'active').order('day_of_week', { ascending: true }).order('starts_at', { ascending: true }).limit(500);
    if (departmentId) query = query.eq('department_id', departmentId);
    const day = Number.parseInt(rawDay ?? '', 10);
    if (day >= 1 && day <= 7) query = query.eq('day_of_week', day);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Post('timetable')
  async createTimetableEntry(@Req() request: AuthenticatedRequest, @Body() body: CreateTimetableEntryDto) {
    if (body.endsAt <= body.startsAt) throw new BadRequestException('End time must be later than start time');
    const client = this.db.forRequest(request);
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('institution_id,status').eq('user_id', request.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new BadRequestException('Active institutional access is required');
    const { data: department, error: departmentError } = await client.from('departments')
      .select('id,institution_id,status').eq('id', body.departmentId).maybeSingle();
    if (departmentError) throw departmentError;
    if (!department || department.institution_id !== profile.institution_id || department.status !== 'active') {
      throw new BadRequestException('Department is not available in your permitted scope');
    }
    const { data, error } = await client.from('timetable_entries').insert({
      institution_id: profile.institution_id, department_id: department.id,
      faculty_id: body.facultyId ?? request.authUser!.id,
      subject: body.subject.trim(), cohort: body.cohort.trim(),
      room: body.room?.trim() || null, day_of_week: body.dayOfWeek,
      starts_at: body.startsAt, ends_at: body.endsAt,
      created_by: request.authUser!.id, status: 'active',
    }).select('id,department_id,faculty_id,subject,cohort,room,day_of_week,starts_at,ends_at,status,created_at').single();
    if (error) {
      if (error.code === '23P01' || error.code === '23505') throw new ConflictException('This room or cohort already has an overlapping timetable entry');
      throw error;
    }
    return data;
  }

  @Get('syllabus')
  async syllabus(@Req() request: AuthenticatedRequest, @Query('departmentId') departmentId?: string, @Query('status') status?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('syllabus_progress')
      .select('id,institution_id,department_id,faculty_id,subject,unit,planned_hours,completed_hours,review_status,updated_by,created_at,updated_at,departments(name,code)')
      .order('updated_at', { ascending: false }).limit(300);
    if (departmentId) query = query.eq('department_id', departmentId);
    if (status && ['draft','submitted','reviewed','returned'].includes(status)) query = query.eq('review_status', status);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Post('syllabus')
  async createSyllabusProgress(@Req() request: AuthenticatedRequest, @Body() body: CreateSyllabusProgressDto) {
    if ((body.completedHours ?? 0) > body.plannedHours) throw new BadRequestException('Completed hours cannot exceed planned hours');
    const client = this.db.forRequest(request);
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('institution_id,status').eq('user_id', request.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new BadRequestException('Active institutional access is required');
    const { data: department, error: departmentError } = await client.from('departments')
      .select('id,institution_id,status').eq('id', body.departmentId).maybeSingle();
    if (departmentError) throw departmentError;
    if (!department || department.institution_id !== profile.institution_id || department.status !== 'active') {
      throw new BadRequestException('Department is not available in your permitted scope');
    }
    const { data, error } = await client.from('syllabus_progress').insert({
      institution_id: profile.institution_id, department_id: department.id,
      faculty_id: request.authUser!.id, subject: body.subject.trim(), unit: body.unit.trim(),
      planned_hours: body.plannedHours, completed_hours: body.completedHours ?? 0,
      review_status: 'draft', updated_by: request.authUser!.id,
    }).select('id,department_id,faculty_id,subject,unit,planned_hours,completed_hours,review_status,updated_at').single();
    if (error) throw error;
    return data;
  }

  @Patch('syllabus/:id')
  async updateSyllabusProgress(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateSyllabusProgressDto) {
    const client = this.db.forRequest(request);
    const { data: current, error: currentError } = await client.from('syllabus_progress')
      .select('id,planned_hours,completed_hours').eq('id', id).maybeSingle();
    if (currentError) throw currentError;
    if (!current) throw new BadRequestException('Syllabus progress item is not in your permitted scope');
    const planned = body.plannedHours ?? current.planned_hours;
    const completed = body.completedHours ?? current.completed_hours;
    if (completed > planned) throw new BadRequestException('Completed hours cannot exceed planned hours');
    const patch: Record<string, unknown> = { updated_by: request.authUser!.id };
    if (body.plannedHours !== undefined) patch.planned_hours = body.plannedHours;
    if (body.completedHours !== undefined) patch.completed_hours = body.completedHours;
    if (body.reviewStatus !== undefined) patch.review_status = body.reviewStatus;
    const { data, error } = await client.from('syllabus_progress').update(patch).eq('id', id)
      .select('id,department_id,faculty_id,subject,unit,planned_hours,completed_hours,review_status,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new BadRequestException('Syllabus progress update is not permitted');
    return data;
  }
}
