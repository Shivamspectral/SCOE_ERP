import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Controller('circulars')
@UseGuards(SupabaseAuthGuard)
export class CircularsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('status') status?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('circulars')
      .select('id,institution_id,title,content,category,audience,status,publish_at,acknowledge_by,author_id,created_at,updated_at')
      .order('created_at', { ascending: false }).limit(100);
    if (status && ['draft','published','archived'].includes(status)) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }
}
