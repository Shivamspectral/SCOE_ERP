import { Controller, ForbiddenException, Get, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Controller('faculty')
@UseGuards(SupabaseAuthGuard)
export class FacultyController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    const client = this.db.forRequest(request);
    const userId = request.authUser!.id;
    const { data: actor, error: actorError } = await client.from('profiles')
      .select('institution_id,status').eq('user_id', userId).maybeSingle();
    if (actorError) throw actorError;
    if (!actor || actor.status !== 'active') throw new ForbiddenException('Active institutional access is required');

    const { data: assignments, error: assignmentsError } = await client.from('role_assignments')
      .select('user_id,department_id').eq('role', 'faculty').eq('status', 'active');
    if (assignmentsError) throw assignmentsError;
    const facultyAssignments = assignments ?? [];
    const facultyIds = [...new Set(facultyAssignments.map((row) => row.user_id))];
    if (!facultyIds.length) return { data: [], count: 0 };

    const { data: profiles, error: profilesError } = await client.from('profiles')
      .select('user_id,institution_id,email,full_name,title,phone,department_id,status,departments(name,code)')
      .eq('institution_id', actor.institution_id).eq('status', 'active')
      .in('user_id', facultyIds).order('full_name', { ascending: true }).limit(500);
    if (profilesError) throw profilesError;

    const rows = (profiles ?? []).map((profile) => {
      const assignment = facultyAssignments.find((row) => row.user_id === profile.user_id);
      const department = profile.departments?.[0] ?? null;
      return {
        id: profile.user_id,
        email: profile.email ?? '',
        name: profile.full_name,
        title: profile.title,
        designation: profile.title || 'Faculty',
        phone: profile.phone,
        department_id: profile.department_id,
        department,
        dept: department?.name || '',
        role: 'Faculty',
        roleAssignmentDepartmentId: assignment?.department_id ?? null,
      };
    });
    return { data: rows, count: rows.length };
  }
}
