import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateLibraryBookDto, IssueLibraryLoanDto, UpdateLibraryBookDto } from './library.dto';

@Controller('library')
@UseGuards(SupabaseAuthGuard)
export class LibraryController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get('books')
  async listBooks(@Req() req: AuthenticatedRequest, @Query('search') search?: string, @Query('category') category?: string, @Query('status') status?: string) {
    let q = this.db.forRequest(req).from('library_books')
      .select('id,isbn,title,author,category,publisher,publication_year,total_copies,available_copies,shelf_location,status,created_at,updated_at')
      .order('title').limit(200);
    if (status === 'archived') q = q.eq('status', 'archived'); else q = q.eq('status', 'active');
    if (category?.trim()) q = q.eq('category', category.trim().slice(0, 80));
    if (search?.trim()) {
      const term = search.trim().replace(/[^a-zA-Z0-9@.+ -]/g, '').slice(0, 80);
      if (term) q = q.or(`title.ilike.%${term}%,author.ilike.%${term}%,isbn.ilike.%${term}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return { data: data ?? [] };
  }

  @Post('books')
  async createBook(@Req() req: AuthenticatedRequest, @Body() body: CreateLibraryBookDto) {
    if (body.totalCopies < 0) throw new BadRequestException('Total copies cannot be negative');
    const client = this.db.forRequest(req);
    const { data: profile, error: profileError } = await client.from('profiles').select('institution_id,status').eq('user_id', req.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new BadRequestException('Active institutional access is required');
    const { data, error } = await client.from('library_books').insert({
      institution_id: profile.institution_id, isbn: body.isbn?.trim() || null,
      title: body.title.trim(), author: body.author.trim(), category: body.category?.trim() || 'General',
      publisher: body.publisher?.trim() || null, publication_year: body.publicationYear ?? null,
      total_copies: body.totalCopies, available_copies: body.totalCopies,
      shelf_location: body.shelfLocation?.trim() || null, created_by: req.authUser!.id,
    }).select('*').single();
    if (error?.code === '23505') throw new BadRequestException('A book with this ISBN already exists');
    if (error) throw error;
    return data;
  }

  @Patch('books/:id')
  async updateBook(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: UpdateLibraryBookDto) {
    const client = this.db.forRequest(req);
    const { data: current, error: readError } = await client.from('library_books').select('*').eq('id', id).maybeSingle();
    if (readError) throw readError;
    if (!current) throw new NotFoundException('Book not found or not accessible');
    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = body.title.trim();
    if (body.author !== undefined) patch.author = body.author.trim();
    if (body.category !== undefined) patch.category = body.category.trim();
    if (body.publisher !== undefined) patch.publisher = body.publisher.trim() || null;
    if (body.publicationYear !== undefined) patch.publication_year = body.publicationYear;
    if (body.shelfLocation !== undefined) patch.shelf_location = body.shelfLocation.trim() || null;
    if (body.status !== undefined) patch.status = body.status;
    if (body.totalCopies !== undefined) {
      const issued = current.total_copies - current.available_copies;
      if (body.totalCopies < issued) throw new BadRequestException('Total copies cannot be lower than currently issued copies');
      patch.total_copies = body.totalCopies;
      patch.available_copies = body.totalCopies - issued;
    }
    if (!Object.keys(patch).length) throw new BadRequestException('No supported fields were provided');
    const { data, error } = await client.from('library_books').update(patch).eq('id', id)
      .select('id,isbn,title,author,category,publisher,publication_year,total_copies,available_copies,shelf_location,status,updated_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Book not found or update is not permitted');
    return data;
  }

  @Get('loans')
  async listLoans(@Req() req: AuthenticatedRequest, @Query('status') status?: string, @Query('studentId') studentId?: string) {
    let q = this.db.forRequest(req).from('library_loans')
      .select('id,book_id,student_id,issued_by,issued_at,due_at,returned_at,status,notes,library_books(title,isbn,author),academic_students(full_name,roll_number,registration_number,department_id)')
      .order('issued_at', { ascending: false }).limit(300);
    if (status && ['issued','returned','lost'].includes(status)) q = q.eq('status', status);
    if (studentId) q = q.eq('student_id', studentId);
    const { data, error } = await q;
    if (error) throw error;
    return { data: data ?? [] };
  }

  @Post('loans')
  async issueLoan(@Req() req: AuthenticatedRequest, @Body() body: IssueLibraryLoanDto) {
    const dueAt = new Date(body.dueAt);
    if (Number.isNaN(dueAt.getTime()) || dueAt <= new Date()) throw new BadRequestException('Due date must be in the future');
    const client = this.db.forRequest(req);
    const { data: profile, error: profileError } = await client.from('profiles').select('institution_id,status').eq('user_id', req.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new BadRequestException('Active institutional access is required');
    const { data: student, error: studentError } = await client.from('academic_students').select('id,institution_id,status').eq('id', body.studentId).maybeSingle();
    if (studentError) throw studentError;
    if (!student || student.institution_id !== profile.institution_id || student.status !== 'active') throw new BadRequestException('Active internal student record not found');
    const { data, error } = await client.from('library_loans').insert({
      institution_id: profile.institution_id, book_id: body.bookId, student_id: body.studentId,
      issued_by: req.authUser!.id, due_at: dueAt.toISOString(), notes: body.notes?.trim() || null,
    }).select('id,book_id,student_id,issued_at,due_at,status,notes').single();
    if (error?.code === '23514') throw new BadRequestException(error.message);
    if (error) throw error;
    return data;
  }

  @Post('loans/:id/return')
  async returnLoan(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const client = this.db.forRequest(req);
    const { data: current, error: readError } = await client.from('library_loans').select('id,status').eq('id', id).maybeSingle();
    if (readError) throw readError;
    if (!current) throw new NotFoundException('Loan not found or not accessible');
    if (current.status !== 'issued') throw new BadRequestException('Only issued loans can be returned');
    const { data, error } = await client.from('library_loans').update({ status: 'returned', returned_at: new Date().toISOString(), returned_by: req.authUser!.id })
      .eq('id', id).eq('status', 'issued').select('id,status,returned_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new BadRequestException('Loan has already been returned or changed');
    return data;
  }
}
