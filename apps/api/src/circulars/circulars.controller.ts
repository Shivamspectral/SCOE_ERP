import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateCircularDto } from './circular.dto';

@Controller('circulars')
@UseGuards(SupabaseAuthGuard)
export class CircularsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  private async requirePublisher(client: ReturnType<SupabaseRequestClient['forRequest']>, userId: string) {
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('institution_id,status').eq('user_id', userId).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') {
      throw new ForbiddenException('Active institutional access is required');
    }
    const { data: roles, error: roleError } = await client.from('role_assignments')
      .select('role,department_id').eq('user_id', userId).eq('status', 'active');
    if (roleError) throw roleError;
    const allowed = (roles ?? []).some((row) =>
      ['principal', 'administrator'].includes(row.role)
      || (row.role === 'coordinator' && row.department_id === null));
    if (!allowed) {
      throw new ForbiddenException('Circular publication requires the Principal, Administrator, or campus-wide Coordinator role');
    }
    return profile;
  }

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('status') status?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('circulars')
      .select('id,institution_id,title,content,category,audience,status,publish_at,acknowledge_by,author_id,created_at,updated_at')
      .order('created_at', { ascending: false }).limit(100);
    if (status && ['draft','published','archived'].includes(status)) query = query.eq('status', status);
    else query = query.eq('status', 'published');
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: CreateCircularDto) {
    const client = this.db.forRequest(request);
    const profile = await this.requirePublisher(client, request.authUser!.id);

    const { data, error } = await client.from('circulars').insert({
      institution_id: profile.institution_id,
      author_id: request.authUser!.id,
      title: body.title.trim(),
      content: body.content.trim(),
      category: body.category ?? 'general',
      audience: 'all',
      status: 'draft',
      acknowledge_by: body.acknowledgeBy ?? null,
    }).select('id,title,content,category,audience,status,author_id,created_at,updated_at').single();
    if (error) throw error;
    return data;
  }

  @Post(':id/publish')
  async publish(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const client = this.db.forRequest(request);
    await this.requirePublisher(client, request.authUser!.id);
    const { data, error } = await client.from('circulars').update({
      status: 'published', publish_at: new Date().toISOString(),
    }).eq('id', id).eq('status', 'draft')
      .select('id,title,category,status,publish_at,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Draft circular not found or publication is not permitted');
    return data;
  }
}
