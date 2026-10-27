import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateDocumentDto, UpdateDocumentDto } from './documents.dto';

@Controller('documents')
@UseGuards(SupabaseAuthGuard)
export class DocumentsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('departmentId') departmentId?: string, @Query('status') status?: string, @Query('category') category?: string, @Query('search') search?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('documents')
      .select('id,institution_id,owner_id,department_id,title,category,status,version,expires_at,created_at,updated_at,departments(name,code)')
      .order('updated_at', { ascending: false }).limit(300);
    if (departmentId) query = query.eq('department_id', departmentId);
    if (status && ['draft','active','archived'].includes(status)) query = query.eq('status', status);
    if (category && ['general','academic','policy','finance','student','staff','quality'].includes(category)) query = query.eq('category', category);
    if (search?.trim()) query = query.ilike('title', `%${search.trim().replace(/[%_]/g, '')}%`);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], count: data?.length ?? 0 };
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: CreateDocumentDto) {
    const client = this.db.forRequest(request);
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('institution_id,status').eq('user_id', request.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new BadRequestException('Active institutional access is required');
    if (body.departmentId) {
      const { data: department, error } = await client.from('departments')
        .select('id,institution_id,status').eq('id', body.departmentId).maybeSingle();
      if (error) throw error;
      if (!department || department.institution_id !== profile.institution_id || department.status !== 'active') {
        throw new BadRequestException('Choose an active department in your institution');
      }
    }
    const { data, error } = await client.from('documents').insert({
      institution_id: profile.institution_id, owner_id: request.authUser!.id,
      department_id: body.departmentId ?? null, title: body.title.trim(),
      category: body.category, status: 'draft', expires_at: body.expiresAt ?? null,
    }).select('id,institution_id,owner_id,department_id,title,category,status,version,expires_at,created_at,updated_at').single();
    if (error) throw error;
    return data;
  }

  @Patch(':id')
  async update(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateDocumentDto) {
    const client = this.db.forRequest(request);
    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = body.title.trim();
    if (body.category !== undefined) patch.category = body.category;
    if (body.status !== undefined) patch.status = body.status;
    if (body.expiresAt !== undefined) patch.expires_at = body.expiresAt;
    if (!Object.keys(patch).length) throw new BadRequestException('No supported fields were provided');
    if (body.status === 'active') {
      const { data: roles, error } = await client.from('role_assignments').select('role,department_id').eq('user_id', request.authUser!.id).eq('status', 'active');
      if (error) throw error;
      const { data: doc, error: docError } = await client.from('documents').select('department_id').eq('id', id).maybeSingle();
      if (docError) throw docError;
      if (!doc) throw new NotFoundException('Document record not found');
      const allowed = (roles ?? []).some((role) => ['principal','administrator'].includes(role.role) || (['hod','coordinator'].includes(role.role) && (!role.department_id || role.department_id === doc.department_id)));
      if (!allowed) throw new BadRequestException('Only an authorised institutional role can activate a document');
    }
    const { data, error } = await client.from('documents').update(patch).eq('id', id)
      .select('id,institution_id,owner_id,department_id,title,category,status,version,expires_at,created_at,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Document not found or update is not permitted');
    return data;
  }
}
