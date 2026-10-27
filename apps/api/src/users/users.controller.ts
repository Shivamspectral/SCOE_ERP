import { BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, InternalServerErrorException, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { UpdateMemberDto } from './member.dto';
import { InviteMemberDto } from './invite-member.dto';

const roleToDisplay: Record<string, string> = { principal: 'Principal', administrator: 'Super Admin', coordinator: 'Vice-Principal', hod: 'HOD', faculty: 'Faculty', staff: 'Staff' };

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
  constructor(private readonly db: SupabaseRequestClient, private readonly config: ConfigService) {}

  /**
   * Resolve authorization from trusted institutional records, never from client-supplied role claims.
   * Mutating the staff directory is restricted to active Principals and Administrators.
   */
  private async requireManager(client: ReturnType<SupabaseRequestClient['forRequest']>, userId: string) {
    const { data: actor, error: actorError } = await client.from('profiles')
      .select('user_id,institution_id,department_id,status')
      .eq('user_id', userId).maybeSingle();
    if (actorError) throw actorError;
    if (!actor || actor.status !== 'active') {
      throw new ForbiddenException('Active institutional access is required');
    }

    const { data: assignments, error: assignmentsError } = await client.from('role_assignments')
      .select('role').eq('user_id', userId).eq('status', 'active');
    if (assignmentsError) throw assignmentsError;
    const roles = assignments ?? [];
    const isPrincipal = roles.some((item) => item.role === 'principal');
    const isAdministrator = roles.some((item) => item.role === 'administrator');
    if (!isPrincipal && !isAdministrator) {
      throw new ForbiddenException('Only the Principal or an authorized administrator can manage staff accounts');
    }
    return { actor, isPrincipal, isAdministrator };
  }

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
      email: '',
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
    const { actor } = await this.requireManager(client, request.authUser!.id);
    const limit = Math.min(100, Math.max(1, Number.parseInt(rawLimit ?? '50', 10) || 50));
    const offset = Math.max(0, Number.parseInt(rawOffset ?? '0', 10) || 0);
    let query = client.from('profiles')
      .select('user_id,institution_id,full_name,title,phone,department_id,status,created_at,updated_at,departments(name,code)', { count: 'exact' })
      .eq('institution_id', actor.institution_id)
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
        id: profile.user_id, email: '', institution_id: profile.institution_id,
        name: profile.full_name, title: profile.title, phone: profile.phone,
        department_id: profile.department_id, department: profile.departments,
        status: profile.status, roles: memberRoles, role: roleToDisplay[memberRoles[0]?.role ?? ''] ?? memberRoles[0]?.role ?? null,
        created_at: profile.created_at, updated_at: profile.updated_at,
      };
    });
    return { data, count: count ?? data.length, limit, offset };
  }

  @Post()
  async invite(@Req() request: AuthenticatedRequest, @Body() body: InviteMemberDto) {
    const client = this.db.forRequest(request);
    const { actor, isPrincipal } = await this.requireManager(client, request.authUser!.id);

    const role = roleToDatabase[body.role];
    if (role === 'administrator' && !isPrincipal) {
      throw new ForbiddenException('Only the Principal can invite another administrator');
    }
    if (!role || !['administrator','coordinator','hod','faculty','staff'].includes(role)) {
      throw new BadRequestException('Unsupported staff role');
    }
    const departmentId = body.departmentId ?? actor.department_id ?? null;
    if (['hod', 'faculty'].includes(role) && !departmentId) throw new BadRequestException('A department is required for HOD and faculty accounts');
    if (departmentId) {
      const { data: department, error: departmentError } = await client.from('departments')
        .select('id,institution_id,status').eq('id', departmentId).maybeSingle();
      if (departmentError) throw departmentError;
      if (!department || department.institution_id !== actor.institution_id || department.status !== 'active') {
        throw new BadRequestException('Department is not active in this institution');
      }
    }

    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) throw new ServiceUnavailableException('Staff invitations are not configured on this API deployment');
    const adminClient = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      serviceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
    );
    const { data: invitation, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      body.email.trim().toLowerCase(),
      { data: {
        full_name: body.name.trim(),
        title: body.title?.trim() || null,
        phone: body.phone?.trim() || null,
        institution_id: actor.institution_id,
        department_id: departmentId,
      } },
    );
    if (inviteError) throw new ConflictException('The account invitation could not be created. Verify the email and Auth invitation settings.');
    const userId = invitation.user?.id;
    if (!userId) throw new InternalServerErrorException('Supabase did not return an invited user ID');

    const { error: assignmentError } = await client.rpc('manage_member', {
      p_user_id: userId,
      p_status: 'pending',
      p_role: role,
      p_department_id: departmentId,
      p_responsibility_id: body.responsibilityId ?? null,
    });
    if (assignmentError) {
      await adminClient.auth.admin.deleteUser(userId).catch(() => undefined);
      throw new BadRequestException('Invitation role assignment failed. The new account was not activated.');
    }
    return { id: userId, email: invitation.user?.email ?? body.email, name: body.name.trim(), role: body.role, status: 'pending' };
  }

  @Get(':id')
  async get(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const client = this.db.forRequest(request);
    const { actor } = await this.requireManager(client, request.authUser!.id);
    const member = await this.readMember(client, id);
    if (member.institution_id !== actor.institution_id) {
      throw new NotFoundException('Staff member not found');
    }
    return member;
  }

  @Patch(':id')
  async update(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateMemberDto) {
    const client = this.db.forRequest(request);
    const { actor, isPrincipal } = await this.requireManager(client, request.authUser!.id);
    const current = await this.readMember(client, id);
    if (current.institution_id !== actor.institution_id) {
      throw new ForbiddenException('Staff members can only be managed within your institution');
    }
    const currentRoles = current.roles as Array<{ role: string }>;
    const targetIsPrivileged = currentRoles.some((item) => item.role === 'principal' || item.role === 'administrator');
    if (targetIsPrivileged && !isPrincipal) {
      throw new ForbiddenException('Only the Principal can manage Principal or Administrator accounts');
    }
    const hasAccessChange = body.role !== undefined || body.status !== undefined || body.departmentId !== undefined || body.responsibilityId !== undefined;
    if (request.authUser!.id === id && hasAccessChange) {
      throw new ForbiddenException('You cannot change your own role, status, department, or responsibility');
    }
    if (body.role !== undefined && roleToDatabase[body.role] === 'administrator' && !isPrincipal) {
      throw new ForbiddenException('Only the Principal can assign the administrator role');
    }
    if (body.departmentId !== undefined) {
      const { data: department, error: departmentError } = await client.from('departments')
        .select('id,institution_id,status').eq('id', body.departmentId).maybeSingle();
      if (departmentError) throw departmentError;
      if (!department || department.institution_id !== actor.institution_id || department.status !== 'active') {
        throw new BadRequestException('Department is not active in this institution');
      }
    }

    const activeRoles = current.roles as Array<{ role: string; department_id: string | null; responsibility_id: string | null }>;
    if (hasAccessChange && activeRoles.length > 1 && body.responsibilityId === undefined) {
      throw new BadRequestException('This member has multiple active role assignments; specify responsibilityId to change one assignment.');
    }
    const assignment = body.responsibilityId
      ? activeRoles.find((role) => role.responsibility_id === body.responsibilityId)
      : activeRoles[0];
    if (body.responsibilityId !== undefined && !assignment) {
      throw new BadRequestException('The selected responsibility does not match an active role assignment for this staff member');
    }
    const role = body.role !== undefined ? roleToDatabase[body.role] : assignment?.role ?? 'staff';
    if (hasAccessChange && (!role || !['administrator','coordinator','hod','faculty','staff'].includes(role))) {
      throw new BadRequestException('Unsupported role change');
    }

    if (body.name !== undefined || body.title !== undefined || body.phone !== undefined) {
      const patch: Record<string, unknown> = {};
      if (body.name !== undefined) patch.full_name = body.name.trim();
      if (body.title !== undefined) patch.title = body.title.trim() || null;
      if (body.phone !== undefined) patch.phone = body.phone.trim() || null;
      const { error } = await client.from('profiles').update(patch).eq('user_id', id);
      if (error) throw error;
    }

    if (hasAccessChange) {
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
    const { actor, isPrincipal } = await this.requireManager(client, request.authUser!.id);
    if (request.authUser!.id === id) {
      throw new ForbiddenException('You cannot suspend your own account');
    }
    const current = await this.readMember(client, id);
    if (current.institution_id !== actor.institution_id) {
      throw new ForbiddenException('Staff members can only be managed within your institution');
    }
    const roles = current.roles as Array<{ role: string; department_id: string | null }>;
    if (roles.some((item) => item.role === 'principal' || item.role === 'administrator') && !isPrincipal) {
      throw new ForbiddenException('Only the Principal can suspend Principal or Administrator accounts');
    }
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
