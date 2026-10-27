import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateStudentDto, UpdateStudentDto } from './student.dto';

@Controller('students')
@UseGuards(SupabaseAuthGuard)
export class StudentsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('limit') rawLimit?: string, @Query('offset') rawOffset?: string, @Query('classId') classId?: string, @Query('departmentId') departmentId?: string, @Query('status') status?: string, @Query('search') search?: string) {
    const client = this.db.forRequest(request);
    const limit = Math.min(200, Math.max(1, Number.parseInt(rawLimit ?? '100', 10) || 100));
    const offset = Math.max(0, Number.parseInt(rawOffset ?? '0', 10) || 0);
    let query = client.from('academic_students')
      .select('id,institution_id,department_id,class_id,roll_number,registration_number,full_name,email,status,metadata,created_at,updated_at,departments(name,code),academic_classes(name,year_of_study,division,academic_year)', { count: 'exact' })
      .order('full_name', { ascending: true }).range(offset, offset + limit - 1);
    if (classId) query = query.eq('class_id', classId);
    if (departmentId) query = query.eq('department_id', departmentId);
    if (status && ['active','inactive','graduated','transferred'].includes(status)) query = query.eq('status', status);
    if (search?.trim()) query = query.ilike('full_name', `%${search.trim().replace(/[%_]/g, '')}%`);
    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? data?.length ?? 0, limit, offset };
  }

  @Get(':id')
  async get(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const client = this.db.forRequest(request);
    const { data, error } = await client.from('academic_students')
      .select('id,institution_id,department_id,class_id,roll_number,registration_number,full_name,email,status,metadata,created_at,updated_at,departments(name,code),academic_classes(name,year_of_study,division,academic_year)')
      .eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Student record not found');
    return data;
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: CreateStudentDto) {
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
    if (body.classId) {
      const { data: academicClass, error: classError } = await client.from('academic_classes')
        .select('id,department_id,institution_id,status').eq('id', body.classId).maybeSingle();
      if (classError) throw classError;
      if (!academicClass || academicClass.institution_id !== profile.institution_id || academicClass.department_id !== department.id || academicClass.status !== 'active') {
        throw new BadRequestException('Class is not active in the selected department');
      }
    }

    const { data, error } = await client.from('academic_students').insert({
      institution_id: profile.institution_id,
      department_id: department.id,
      class_id: body.classId ?? null,
      roll_number: body.rollNumber.trim(),
      registration_number: body.registrationNumber?.trim() || null,
      full_name: body.fullName.trim(),
      email: body.email?.trim().toLowerCase() || null,
      metadata: body.metadata ?? {},
      created_by: request.authUser!.id,
    }).select('id,department_id,class_id,roll_number,registration_number,full_name,email,status,metadata,created_at').single();
    if (error) throw error;
    return data;
  }

  @Patch(':id')
  async update(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateStudentDto) {
    const client = this.db.forRequest(request);
    const patch: Record<string, unknown> = {};
    if (body.fullName !== undefined) patch.full_name = body.fullName.trim();
    if (body.rollNumber !== undefined) patch.roll_number = body.rollNumber.trim();
    if (body.registrationNumber !== undefined) patch.registration_number = body.registrationNumber.trim() || null;
    if (body.email !== undefined) patch.email = body.email.trim().toLowerCase() || null;
    if (body.status !== undefined) patch.status = body.status;
    if (body.metadata !== undefined) patch.metadata = body.metadata;
    if (!Object.keys(patch).length) throw new BadRequestException('No supported fields were provided');
    const { data, error } = await client.from('academic_students').update(patch)
      .eq('id', id).select('id,department_id,class_id,roll_number,registration_number,full_name,email,status,metadata,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Student record not found or update is not permitted');
    return data;
  }
}
