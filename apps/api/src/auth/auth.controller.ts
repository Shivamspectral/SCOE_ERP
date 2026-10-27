import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from './supabase-auth.guard';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getMe(@Req() request: AuthenticatedRequest) {
    const client = this.db.forRequest(request);
    const user = request.authUser!;

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('user_id,institution_id,full_name,title,phone,department_id,status,created_at,updated_at,departments(name,code),departments(name,code)')
      .eq('user_id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const { data: roles, error: roleError } = await client
      .from('role_assignments')
      .select('id,role,department_id,responsibility_id,status,created_at')
      .eq('user_id', user.id)
      .eq('status', 'active');
    if (roleError) throw roleError;

    return {
      identity: { id: user.id, email: user.email ?? null },
      profile: profile ?? null,
      roles: roles ?? [],
      primaryRole: roles?.[0]?.role ?? null,
      accessStatus: profile?.status ?? 'profile_missing',
    };
  }
}
