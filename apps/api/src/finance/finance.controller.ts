import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { CreateFeeInvoiceDto, CreateFeeStructureDto, RecordFeePaymentDto } from './finance.dto';

@Controller('finance')
@UseGuards(SupabaseAuthGuard)
export class FinanceController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get('fee-structures')
  async structures(@Req() req: AuthenticatedRequest, @Query('academicYear') academicYear?: string) {
    let q = this.db.forRequest(req).from('fee_structures')
      .select('id,department_id,academic_year,name,amount,currency,status,created_at,updated_at')
      .order('academic_year', { ascending: false }).order('name').limit(200);
    if (academicYear) q = q.eq('academic_year', academicYear.slice(0, 20));
    const { data, error } = await q;
    if (error) throw error;
    return { data: data ?? [] };
  }

  @Post('fee-structures')
  async createStructure(@Req() req: AuthenticatedRequest, @Body() body: CreateFeeStructureDto) {
    const client = this.db.forRequest(req);
    const { data: profile, error: profileError } = await client.from('profiles').select('institution_id,status').eq('user_id', req.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new BadRequestException('Active institutional access is required');
    if (body.departmentId) {
      const { data: dept, error } = await client.from('departments').select('id,institution_id,status').eq('id', body.departmentId).maybeSingle();
      if (error) throw error;
      if (!dept || dept.institution_id !== profile.institution_id || dept.status !== 'active') throw new BadRequestException('Department is not active in this institution');
    }
    const currency = (body.currency || 'INR').toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new BadRequestException('Currency must be a three-letter ISO code');
    const { data, error } = await client.from('fee_structures').insert({
      institution_id: profile.institution_id, department_id: body.departmentId ?? null,
      academic_year: body.academicYear.trim(), name: body.name.trim(), amount: body.amount,
      currency, created_by: req.authUser!.id,
    }).select('id,department_id,academic_year,name,amount,currency,status,created_at').single();
    if (error) throw error;
    return data;
  }

  @Get('invoices')
  async invoices(@Req() req: AuthenticatedRequest, @Query('status') status?: string, @Query('studentId') studentId?: string, @Query('search') search?: string) {
    let q = this.db.forRequest(req).from('fee_invoices')
      .select('id,student_id,fee_structure_id,invoice_number,description,amount_due,amount_paid,currency,due_at,status,notes,created_at,academic_students(full_name,roll_number,registration_number)')
      .order('created_at', { ascending: false }).limit(300);
    if (status && ['unpaid','partially_paid','paid','waived','cancelled'].includes(status)) q = q.eq('status', status);
    if (studentId) q = q.eq('student_id', studentId);
    if (search?.trim()) {
      const term = search.trim().replace(/[^a-zA-Z0-9@.+ -]/g, '').slice(0, 80);
      if (term) q = q.or(`invoice_number.ilike.%${term}%,description.ilike.%${term}%`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return { data: data ?? [] };
  }

  @Post('invoices')
  async createInvoice(@Req() req: AuthenticatedRequest, @Body() body: CreateFeeInvoiceDto) {
    const client = this.db.forRequest(req);
    const { data: profile, error: profileError } = await client.from('profiles').select('institution_id,status').eq('user_id', req.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new BadRequestException('Active institutional access is required');
    const { data: student, error: studentError } = await client.from('academic_students').select('id,institution_id,status').eq('id', body.studentId).maybeSingle();
    if (studentError) throw studentError;
    if (!student || student.institution_id !== profile.institution_id || student.status !== 'active') throw new BadRequestException('Active internal student record not found');
    if (body.feeStructureId) {
      const { data: structure, error } = await client.from('fee_structures').select('id,institution_id,status,currency,amount').eq('id', body.feeStructureId).maybeSingle();
      if (error) throw error;
      if (!structure || structure.institution_id !== profile.institution_id || structure.status !== 'active') throw new BadRequestException('Fee structure is not active in this institution');
      if (body.currency && body.currency.toUpperCase() !== structure.currency) throw new BadRequestException('Invoice currency must match its fee structure');
    }
    const currency = (body.currency || 'INR').toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new BadRequestException('Currency must be a three-letter ISO code');
    const { data, error } = await client.from('fee_invoices').insert({
      institution_id: profile.institution_id, student_id: body.studentId, fee_structure_id: body.feeStructureId ?? null,
      invoice_number: body.invoiceNumber.trim(), description: body.description.trim(), amount_due: body.amountDue,
      currency, due_at: body.dueAt.slice(0, 10), notes: body.notes?.trim() || null, created_by: req.authUser!.id,
    }).select('id,student_id,invoice_number,description,amount_due,amount_paid,currency,due_at,status,created_at').single();
    if (error?.code === '23505') throw new BadRequestException('Invoice number already exists in this institution');
    if (error) throw error;
    return data;
  }

  @Get('invoices/:id/payments')
  async payments(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    const { data, error } = await this.db.forRequest(req).from('fee_payments')
      .select('id,invoice_id,amount,currency,method,reference,received_at,received_by,notes')
      .eq('invoice_id', id).order('received_at', { ascending: false }).limit(200);
    if (error) throw error;
    return { data: data ?? [] };
  }

  @Post('invoices/:id/payments')
  async recordPayment(@Req() req: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: RecordFeePaymentDto) {
    const client = this.db.forRequest(req);
    const { data: invoice, error: invoiceError } = await client.from('fee_invoices')
      .select('id,institution_id,status,currency,amount_due,amount_paid').eq('id', id).maybeSingle();
    if (invoiceError) throw invoiceError;
    if (!invoice || !['unpaid','partially_paid'].includes(invoice.status)) throw new BadRequestException('Invoice is not open for payment');
    if (body.amount > Number(invoice.amount_due) - Number(invoice.amount_paid)) throw new BadRequestException('Payment exceeds the outstanding balance');
    const { data, error } = await client.from('fee_payments').insert({
      institution_id: invoice.institution_id, invoice_id: id, amount: body.amount, currency: invoice.currency,
      method: body.method, reference: body.reference?.trim() || null, notes: body.notes?.trim() || null,
      received_by: req.authUser!.id,
    }).select('id,invoice_id,amount,currency,method,reference,received_at,received_by,notes').single();
    if (error?.code === '23514') throw new BadRequestException(error.message);
    if (error) throw error;
    return data;
  }
}
