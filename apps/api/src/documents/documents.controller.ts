import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, ServiceUnavailableException, UnsupportedMediaTypeException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { basename, extname } from 'node:path';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateDocumentDto, UpdateDocumentDto } from './documents.dto';

type UploadedDocumentFile = { originalname: string; mimetype: string; size: number; buffer: Buffer };
const ALLOWED_DOCUMENT_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

@Controller('documents')
@UseGuards(SupabaseAuthGuard)
export class DocumentsController {
  constructor(private readonly db: SupabaseRequestClient, private readonly config: ConfigService) {}

  private storageAdmin() {
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) throw new ServiceUnavailableException('Document file storage is not configured on this API deployment');
    return createClient(this.config.getOrThrow<string>('SUPABASE_URL'), serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  private async assertFileManager(request: AuthenticatedRequest, document: any) {
    const client = this.db.forRequest(request);
    const userId = request.authUser!.id;
    const { data: profile, error: profileError } = await client.from('profiles')
      .select('institution_id,status').eq('user_id', userId).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active' || profile.institution_id !== document.institution_id) {
      throw new ForbiddenException('Active institutional access is required');
    }
    const { data: roles, error: rolesError } = await client.from('role_assignments')
      .select('role,department_id').eq('user_id', userId).eq('status', 'active');
    if (rolesError) throw rolesError;
    const manager = (roles ?? []).some((role) =>
      ['principal', 'administrator'].includes(role.role)
      || (['hod', 'coordinator'].includes(role.role) && (!role.department_id || role.department_id === document.department_id))
    );
    if (document.owner_id !== userId && !manager) {
      throw new ForbiddenException('Only the document owner or authorized institutional leadership can upload files');
    }
  }

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('departmentId') departmentId?: string, @Query('status') status?: string, @Query('category') category?: string, @Query('search') search?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('documents')
      .select('id,institution_id,owner_id,department_id,title,category,status,version,expires_at,file_name,mime_type,file_size,uploaded_by,created_at,updated_at,departments(name,code)')
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
    }).select('id,institution_id,owner_id,department_id,title,category,status,version,expires_at,file_name,mime_type,file_size,uploaded_by,created_at,updated_at').single();
    if (error) throw error;
    return data;
  }

  @Post(':id/file')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadFile(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file?: UploadedDocumentFile,
  ) {
    if (!file || !file.buffer?.length) throw new BadRequestException('Choose a non-empty document file');
    if (file.size > 10 * 1024 * 1024) throw new BadRequestException('Files must be 10 MB or smaller');
    const originalName = basename(file.originalname.replace(/\\/g, '/'));
    const extension = extname(originalName).toLowerCase();
    const allowedExtensions = ALLOWED_DOCUMENT_TYPES[file.mimetype];
    if (!allowedExtensions || !allowedExtensions.includes(extension)) {
      throw new UnsupportedMediaTypeException('Allowed file types are PDF, Word, Excel, CSV, TXT, PNG and JPEG');
    }

    const client = this.db.forRequest(request);
    const { data: document, error: documentError } = await client.from('documents')
      .select('id,institution_id,owner_id,department_id,status,version,storage_path')
      .eq('id', id).maybeSingle();
    if (documentError) throw documentError;
    if (!document) throw new NotFoundException('Document record not found');
    if (document.status === 'archived') throw new BadRequestException('Archived documents cannot receive new files');
    await this.assertFileManager(request, document);

    const safeName = originalName.replace(/[^\w.\-() ]/g, '_').slice(0, 180) || ('document' + extension);
    const storagePath = document.institution_id + '/' + document.id + '/' + randomUUID() + extension;
    const storage = this.storageAdmin();
    const { error: uploadError } = await storage.storage.from('institution-documents').upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (uploadError) throw new BadRequestException('The file could not be stored. Verify storage configuration and file type.');

    const nextVersion = document.storage_path ? Number(document.version || 1) + 1 : Number(document.version || 1);
    const { data, error: updateError } = await client.from('documents').update({
      storage_path: storagePath,
      file_name: safeName,
      mime_type: file.mimetype,
      file_size: file.size,
      uploaded_by: request.authUser!.id,
      version: nextVersion,
    }).eq('id', id)
      .select('id,title,status,version,file_name,mime_type,file_size,uploaded_by,updated_at')
      .maybeSingle();
    if (updateError || !data) {
      await storage.storage.from('institution-documents').remove([storagePath]).catch(() => undefined);
      if (updateError) throw updateError;
      throw new NotFoundException('Document file metadata could not be updated');
    }
    if (document.storage_path) {
      await storage.storage.from('institution-documents').remove([document.storage_path]).catch(() => undefined);
    }
    return data;
  }

  @Get(':id/file')
  async getFileUrl(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const client = this.db.forRequest(request);
    const { data: document, error } = await client.from('documents')
      .select('id,storage_path,file_name,mime_type,file_size,status')
      .eq('id', id).maybeSingle();
    if (error) throw error;
    if (!document || !document.storage_path || !document.file_name) {
      throw new NotFoundException('No file is attached to this document record');
    }
    const storage = this.storageAdmin();
    const { data, error: signError } = await storage.storage.from('institution-documents')
      .createSignedUrl(document.storage_path, 60, { download: document.file_name });
    if (signError || !data?.signedUrl) {
      throw new ServiceUnavailableException('A secure document download link could not be created');
    }
    return { data: { url: data.signedUrl, expiresIn: 60, fileName: document.file_name } };
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
      .select('id,institution_id,owner_id,department_id,title,category,status,version,expires_at,file_name,mime_type,file_size,uploaded_by,created_at,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Document not found or update is not permitted');
    return data;
  }
}
