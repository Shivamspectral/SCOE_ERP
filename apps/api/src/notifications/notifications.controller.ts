import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { UpdateNotificationPreferencesDto } from './notification-preferences.dto';

@Controller('notifications')
@UseGuards(SupabaseAuthGuard)
export class NotificationsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get('preferences')
  async getPreferences(@Req() request: AuthenticatedRequest) {
    const client = this.db.forRequest(request);
    const userId = request.authUser!.id;
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('institution_id,status').eq('user_id', userId).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new ForbiddenException('Active institutional access is required');

    const { data, error } = await client.from('notification_preferences')
      .select('email_alerts,sms_alerts,attendance_warnings')
      .eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return { data: {
      emailAlerts: data?.email_alerts ?? true,
      smsAlerts: data?.sms_alerts ?? false,
      attendanceWarnings: data?.attendance_warnings ?? true,
    } };
  }

  @Put('preferences')
  async updatePreferences(@Req() request: AuthenticatedRequest, @Body() body: UpdateNotificationPreferencesDto) {
    if (!Object.keys(body).length) throw new BadRequestException('At least one notification preference must be provided');
    const client = this.db.forRequest(request);
    const userId = request.authUser!.id;
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('institution_id,status').eq('user_id', userId).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new ForbiddenException('Active institutional access is required');

    const { data: existing, error: readError } = await client.from('notification_preferences')
      .select('email_alerts,sms_alerts,attendance_warnings')
      .eq('user_id', userId).maybeSingle();
    if (readError) throw readError;
    const values = {
      institution_id: profile.institution_id,
      user_id: userId,
      email_alerts: body.emailAlerts ?? existing?.email_alerts ?? true,
      sms_alerts: body.smsAlerts ?? existing?.sms_alerts ?? false,
      attendance_warnings: body.attendanceWarnings ?? existing?.attendance_warnings ?? true,
      updated_by: userId,
    };
    const { data, error } = await client.from('notification_preferences')
      .upsert(values, { onConflict: 'user_id' })
      .select('email_alerts,sms_alerts,attendance_warnings,updated_at').single();
    if (error) throw error;
    return { data: {
      emailAlerts: data.email_alerts,
      smsAlerts: data.sms_alerts,
      attendanceWarnings: data.attendance_warnings,
      updatedAt: data.updated_at,
    } };
  }

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
