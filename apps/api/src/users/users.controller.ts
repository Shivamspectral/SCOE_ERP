import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { UpdateMemberDto } from './member.dto';

const roleToDisplay: Record<string, string> = { administrator: 'Super Admin', coordinator: 'Vice-Principal', hod: 'HOD', faculty: 'Faculty', staff: 'Staff' };

const roleToDatabase: Record<string, string> = {
  'Super Admin': 'administrator', Administrator: 'administrator',
  Coordinator: 'coordinator', 'Vice-Principal': 'coordinator',
  HOD: 'hod', Faculty: 'faculty', Staff: 'staff',
  administrator: 'administrator', coordinator: 'coordinator',
  hod: 'hod', faculty: 'faculty', staff: 'staff',
};

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly db: SupabaseRequestClient) {}

  private async readMember(client: ReturnType<SupabaseRequestClient['forRequest']>, id: string) {
    const { data: profile, error } = await client.from('profiles')
      .select('user_id,institution_id,full_name,title,phone,department_id,status,created_at,updated_at,departments(name,code)')
      .eq('user_id', id).maybeSingle();
    if (error) throw error;
    if (!profile) throw new NotFoundException('Staff member not found');
    const { data: roles, error: rolesError } = await client.from('role_assignments')
      .select('id,role,department_id,responsibility_id,status,created_at')
      .eq('user_id', id).eq('status', 'active');
    if (rolesError) throw rolesError;
    return {
      id: profile.user_id,
      institution_id: profile.institution_id,
      name: profile.full_name,
      title: profile.title,
      phone: profile.phone,
      department_id: profile.department_id,
      department: profile.departments,
      status: profile.status,
      roles: roles ?? [],
      role: roleToDisplay[roles?.[0]?.role ?? ''] ?? roles?.[0]?.role ?? null,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('limit') rawLimit?: string, @Query('offset') rawOffset?: string, @Query('status') status?: string, @Query('departmentId') departmentId?: string, @Query('search') search?: string) {
    const client = this.db.forRequest(request);
    const limit = Math.min(100, Math.max(1, Number.parseInt(rawLimit ?? '50', 10) || 50));
    const offset = Math.max(0, Number.parseInt(rawOffset ?? '0', 10) || 0);
    let query = client.from('profiles')
      .select('user_id,institution_id,full_name,title,phone,department_id,status,created_at,updated_at,departments(name,code)', { count: 'exact' })
      .order('full_name', { ascending: true }).range(offset, offset + limit - 1);
    if (status && ['pending','active','suspended'].includes(status)) query = query.eq('status', status);
    if (departmentId) query = query.eq('department_id', departmentId);
    if (search?.trim()) query = query.ilike('full_name', `%${search.trim().replace(/[%_]/g, '')}%`);
    const { data: profiles, count, error } = await query;
    if (error) throw error;
    const ids = (profiles ?? []).map((profile) => profile.user_id);
    let roles: Array<{ user_id: string; role: string; department_id: string | null; responsibility_id: string | null; status: string }> = [];
    if (ids.length) {
      const result = await client.from('role_assignments')
        .select('user_id,role,department_id,responsibility_id,status')
        .in('user_id', ids).eq('status', 'active');
      if (result.error) throw result.error;
      roles = result.data ?? [];
    }
    const data = (profiles ?? []).map((profile) => {
      const memberRoles = roles.filter((role) => role.user_id === profile.user_id);
      return {
        id: profile.user_id, institution_id: profile.institution_id,
        name: profile.full_name, title: profile.title, phone: profile.phone,
        department_id: profile.department_id, department: profile.departments,
        status: profile.status, roles: memberRoles, role: roleToDisplay[memberRoles[0]?.role ?? ''] ?? memberRoles[0]?.role ?? null,
        created_at: profile.created_at, updated_at: profile.updated_at,
      };
    });
    return { data, count: count ?? data.length, limit, offset };
  }

  @Get(':id')
  async get(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.readMember(this.db.forRequest(request), id);
  }

  @Patch(':id')
  async update(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateMemberDto) {
    const client = this.db.forRequest(request);
    const current = await this.readMember(client, id);
    const hasAccessChange = body.role !== undefined || body.status !== undefined || body.departmentId !== undefined || body.responsibilityId !== undefined;

    if (body.name !== undefined || body.title !== undefined || body.phone !== undefined) {
      const patch: Record<string, unknown> = {};
      if (body.name !== undefined) patch.full_name = body.name.trim();
      if (body.title !== undefined) patch.title = body.title.trim() || null;
      if (body.phone !== undefined) patch.phone = body.phone.trim() || null;
      const { error } = await client.from('profiles').update(patch).eq('user_id', id);
      if (error) throw error;
    }

    if (hasAccessChange) {
      const activeRoles = current.roles as Array<{ role: string; department_id: string | null; responsibility_id: string | null }>;
      if (activeRoles.length > 1 && body.responsibilityId === undefined) {
        throw new BadRequestException('This member has multiple active role assignments; specify responsibilityId to change one assignment.');
      }
      const assignment = body.responsibilityId
        ? activeRoles.find((role) => role.responsibility_id === body.responsibilityId)
        : activeRoles[0];
      const role = body.role ? roleToDatabase[body.role] : assignment?.role ?? 'staff';
      if (!role || !['administrator','coordinator','hod','faculty','staff'].includes(role)) {
        throw new BadRequestException('Unsupported role change');
      }
      const { error } = await client.rpc('manage_member', {
        p_user_id: id,
        p_status: body.status ?? current.status,
        p_role: role,
        p_department_id: body.departmentId ?? assignment?.department_id ?? current.department_id ?? null,
        p_responsibility_id: body.responsibilityId ?? assignment?.responsibility_id ?? null,
      });
      if (error) throw error;
    }
    return this.readMember(client, id);
  }

  @Delete(':id')
  async suspend(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const client = this.db.forRequest(request);
    const current = await this.readMember(client, id);
    const roles = current.roles as Array<{ role: string; department_id: string | null }>;
    const role = roles[0]?.role ?? 'staff';
    const { error } = await client.rpc('manage_member', {
      p_user_id: id, p_status: 'suspended', p_role: role,
      p_department_id: roles[0]?.department_id ?? current.department_id ?? null,
      p_responsibility_id: null,
    });
    if (error) throw error;
    return { id, status: 'suspended' };
  }
}
