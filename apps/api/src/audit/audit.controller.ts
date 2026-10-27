import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Controller('audit-logs')
@UseGuards(SupabaseAuthGuard)
export class AuditController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query('limit') rawLimit?: string,
    @Query('offset') rawOffset?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
  ) {
    const client = this.db.forRequest(request);
    const limit = Math.min(100, Math.max(1, Number.parseInt(rawLimit ?? '50', 10) || 50));
    const offset = Math.max(0, Number.parseInt(rawOffset ?? '0', 10) || 0);
    let query = client.from('audit_logs')
      .select('id,institution_id,actor_id,action,entity_type,entity_id,related_workflow_id,metadata,created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (action?.trim()) query = query.eq('action', action.trim().toLowerCase());
    if (entityType?.trim()) query = query.eq('entity_type', entityType.trim().toLowerCase());
    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? data?.length ?? 0, limit, offset };
  }
}
