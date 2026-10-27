import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Controller('notifications')
@UseGuards(SupabaseAuthGuard)
export class NotificationsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('unread') unread?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('notifications')
      .select('id,title,body,kind,href,read_at,created_at')
      .eq('recipient_id', request.authUser!.id)
      .order('created_at', { ascending: false }).limit(100);
    if (unread === 'true') query = query.is('read_at', null);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Patch(':id/read')
  async markRead(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const client = this.db.forRequest(request);
    const { data, error } = await client.from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id).eq('recipient_id', request.authUser!.id)
      .select('id,read_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Notification not found');
    return data;
  }
}
