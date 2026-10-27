import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Controller('departments')
@UseGuards(SupabaseAuthGuard)
export class DepartmentsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('status') status?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('departments')
      .select('id,institution_id,code,name,description,hod_user_id,status,created_at,updated_at')
      .order('name', { ascending: true }).limit(200);
    if (status === 'active' || status === 'archived') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }
}
