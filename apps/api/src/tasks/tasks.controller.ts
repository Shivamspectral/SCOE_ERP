import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';

const TASK_ROLES = ['faculty', 'hod', 'coordinator', 'principal', 'administrator'];

@Controller('tasks')
@UseGuards(SupabaseAuthGuard)
export class TasksController {
  constructor(private readonly db: SupabaseRequestClient) {}

  private async taskScope(request: AuthenticatedRequest, requestedDepartmentId?: string) {
    const client = this.db.forRequest(request);
    const userId = request.authUser!.id;
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('institution_id,department_id,status').eq('user_id', userId).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new ForbiddenException('Active institutional access is required');

    const { data: assignments, error: rolesError } = await client.from('role_assignments')
      .select('role,department_id').eq('user_id', userId).eq('status', 'active');
    if (rolesError) throw rolesError;
    const roles = assignments ?? [];
    if (!roles.some((role) => TASK_ROLES.includes(role.role))) {
      throw new ForbiddenException('Tasks are available to authorized teaching staff and academic leadership');
    }

    const departmentId = requestedDepartmentId
      || profile.department_id
      || roles.find((role) => role.department_id)?.department_id;
    if (!departmentId) throw new BadRequestException('Choose a department for this task');
    if (!roles.some((role) => TASK_ROLES.includes(role.role) && (!role.department_id || role.department_id === departmentId))) {
      throw new ForbiddenException('You do not have task access in the selected department');
    }

    const { data: department, error: departmentError } = await client.from('departments')
      .select('id,institution_id,status').eq('id', departmentId).maybeSingle();
    if (departmentError) throw departmentError;
    if (!department || department.institution_id !== profile.institution_id || department.status !== 'active') {
      throw new BadRequestException('Choose an active department in your institution');
    }
    return { client, userId, institutionId: profile.institution_id, departmentId };
  }

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('status') status?: string) {
    const { client } = await this.taskScope(request);
    let query = client.from('faculty_workspace_records')
      .select('id,institution_id,owner_user_id,department_id,title,status,priority,due_at,payload,created_at,updated_at,departments(name,code)')
      .eq('resource', 'tasks').order('updated_at', { ascending: false }).limit(200);
    if (status && ['draft', 'completed'].includes(status)) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: CreateTaskDto) {
    const { client, userId, institutionId, departmentId } = await this.taskScope(request, body.departmentId);
    const { data, error } = await client.from('faculty_workspace_records').insert({
      institution_id: institutionId, owner_user_id: userId, department_id: departmentId,
      resource: 'tasks', title: body.title.trim(), status: 'draft', priority: body.priority,
      due_at: body.dueAt ?? null, payload: { category: body.category?.trim() || 'Academics' },
      created_by: userId, updated_by: userId,
    }).select('id,institution_id,owner_user_id,department_id,title,status,priority,due_at,payload,created_at,updated_at,departments(name,code)').single();
    if (error) throw error;
    return data;
  }

  @Patch(':id')
  async update(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateTaskDto) {
    const { client, userId } = await this.taskScope(request);
    const patch: Record<string, unknown> = { updated_by: userId };
    if (body.status !== undefined) patch.status = body.status;
    if (body.title !== undefined) patch.title = body.title.trim();
    if (body.priority !== undefined) patch.priority = body.priority;
    if (body.dueAt !== undefined) patch.due_at = body.dueAt;
    if (body.category !== undefined) patch.payload = { category: body.category.trim() || 'Academics' };
    if (Object.keys(patch).length === 1) throw new BadRequestException('No supported task fields were provided');
    const { data, error } = await client.from('faculty_workspace_records').update(patch)
      .eq('id', id).eq('resource', 'tasks')
      .select('id,institution_id,owner_user_id,department_id,title,status,priority,due_at,payload,created_at,updated_at,departments(name,code)').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Task not found or update is not permitted');
    return data;
  }

  @Delete(':id')
  async cancel(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const { client, userId } = await this.taskScope(request);
    const { data, error } = await client.from('faculty_workspace_records').update({
      status: 'cancelled', updated_by: userId,
    }).eq('id', id).eq('resource', 'tasks')
      .select('id,status,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Task not found or cancellation is not permitted');
    return data;
  }
}
