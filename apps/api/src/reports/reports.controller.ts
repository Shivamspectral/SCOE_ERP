import { BadRequestException, Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

const REPORT_KINDS = ['overview','academic','attendance','finance','admissions','operations','accreditation','library','hr'] as const;
type ReportKind = typeof REPORT_KINDS[number];

@Controller('reports')
@UseGuards(SupabaseAuthGuard)
export class ReportsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get(':kind')
  async generate(@Req() req: AuthenticatedRequest, @Param('kind') kind: string, @Query('from') from?: string, @Query('to') to?: string, @Query('departmentId') departmentId?: string) {
    return this.buildReport(req, kind, from, to, departmentId);
  }

  private async buildReport(req: AuthenticatedRequest, kind: string, from?: string, to?: string, departmentId?: string) {
    if (!REPORT_KINDS.includes(kind as ReportKind)) throw new BadRequestException('Unsupported report kind');
    const client = this.db.forRequest(req);
    const { data: profile, error: profileError } = await client.from('profiles').select('institution_id,status').eq('user_id', req.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new BadRequestException('Active institutional access is required');

    const parsedFrom = from ? new Date(from) : null;
    const parsedTo = to ? new Date(to) : null;
    if (parsedFrom && Number.isNaN(parsedFrom.getTime())) throw new BadRequestException('Invalid report start date');
    if (parsedTo && Number.isNaN(parsedTo.getTime())) throw new BadRequestException('Invalid report end date');
    if (parsedFrom && parsedTo && parsedFrom > parsedTo) throw new BadRequestException('Report start date must not be after end date');
    const parsedToUpperBound = parsedTo && /^\d{4}-\d{2}-\d{2}$/.test(to || '')
      ? new Date(parsedTo.getTime() + 24 * 60 * 60 * 1000 - 1)
      : parsedTo;

    const count = async (table: string, filters: Record<string, string> = {}) => {
      let query: any = client.from(table).select('id', { count: 'exact', head: true });
      if (departmentId && ['academic_classes','academic_subjects','academic_students','attendance_sessions','marks_records','academic_programmes','finance_budgets','hr_employees','research_projects'].includes(table)) query = query.eq('department_id', departmentId);
      if (parsedFrom) query = query.gte('created_at', parsedFrom.toISOString());
      if (parsedTo) {
        const upperBound = /^\d{4}-\d{2}-\d{2}$/.test(to || '') ? new Date(parsedTo.getTime() + 24 * 60 * 60 * 1000 - 1) : parsedTo;
        query = query.lte('created_at', upperBound.toISOString());
      }
      for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
      const { count: total, error } = await query;
      if (error) throw error;
      return total ?? 0;
    };

    const definitions: Record<ReportKind, Array<[string, string, Record<string, string>?]>> = {
      overview: [
        ['activeStudents','academic_students',{status:'active'}], ['activeDepartments','departments',{status:'active'}],
        ['activeClasses','academic_classes',{status:'active'}], ['activeSubjects','academic_subjects',{status:'active'}],
        ['pendingApprovals','workflow_requests',{status:'pending'}], ['publishedNotices','circulars',{status:'published'}],
        ['activeEmployees','hr_employees',{employment_status:'active'}], ['openWorkOrders','campus_work_orders',{status:'open'}],
      ],
      academic: [
        ['activeProgrammes','academic_programmes',{status:'active'}], ['activeClasses','academic_classes',{status:'active'}],
        ['activeSubjects','academic_subjects',{status:'active'}], ['verifiedMarks','marks_records',{status:'verified'}],
        ['lockedMarks','marks_records',{status:'locked'}], ['courseOutcomes','course_outcomes',{status:'active'}],
        ['programOutcomes','program_outcomes',{status:'active'}],
      ],
      attendance: [
        ['sessionsDraft','attendance_sessions',{status:'draft'}], ['sessionsSubmitted','attendance_sessions',{status:'submitted'}],
        ['sessionsVerified','attendance_sessions',{status:'verified'}], ['totalAttendanceRecords','attendance_records',{}],
        ['presentRecords','attendance_records',{attendance_status:'present'}], ['absentRecords','attendance_records',{attendance_status:'absent'}],
        ['onDutyRecords','attendance_records',{attendance_status:'on_duty'}],
      ],
      finance: [
        ['feeStructures','fee_structures',{status:'active'}], ['unpaidInvoices','fee_invoices',{status:'unpaid'}],
        ['partiallyPaidInvoices','fee_invoices',{status:'partially_paid'}], ['paidInvoices','fee_invoices',{status:'paid'}],
        ['approvedBudgets','finance_budgets',{status:'approved'}], ['submittedExpenseClaims','expense_claims',{status:'submitted'}],
        ['approvedExpenseClaims','expense_claims',{status:'approved'}], ['paidExpenseClaims','expense_claims',{status:'paid'}],
      ],
      admissions: [
        ['campaignsOpen','admission_campaigns',{status:'open'}], ['applicationsSubmitted','admission_applications',{status:'submitted'}],
        ['applicationsUnderReview','admission_applications',{status:'under_review'}], ['applicationsOffered','admission_applications',{status:'offered'}],
        ['applicationsAccepted','admission_applications',{status:'accepted'}], ['applicationsRejected','admission_applications',{status:'rejected'}],
      ],
      operations: [
        ['pendingLeave','hr_leave_requests',{status:'pending'}], ['submittedProcurement','procurement_requests',{status:'submitted'}],
        ['openWorkOrders','campus_work_orders',{status:'open'}], ['assetsActive','campus_assets',{status:'active'}],
        ['vehiclesActive','transport_vehicles',{status:'active'}], ['activeHostelRooms','hostel_rooms',{status:'available'}],
        ['activeCommittees','institution_committees',{status:'active'}], ['visitorsCurrentlyOnCampus','visitor_register',{status:'checked_in'}],
      ],
      accreditation: [
        ['evidenceDraft','accreditation_evidence',{status:'draft'}], ['evidenceInProgress','accreditation_evidence',{status:'in_progress'}],
        ['evidenceUnderReview','accreditation_evidence',{status:'submitted_for_review'}], ['evidenceApproved','accreditation_evidence',{status:'approved'}],
        ['attainmentCyclesDraft','outcome_attainment_cycles',{status:'draft'}], ['attainmentCyclesUnderReview','outcome_attainment_cycles',{status:'submitted_for_review'}],
        ['attainmentCyclesApproved','outcome_attainment_cycles',{status:'approved'}],
      ],
      library: [
        ['catalogueItems','library_catalogue_items',{status:'active'}], ['activeLoans','library_loans',{status:'issued'}],
        ['issuedLoans','library_loans',{status:'issued'}],
      ],
      hr: [
        ['activeEmployees','hr_employees',{employment_status:'active'}], ['employeesOnLeave','hr_employees',{employment_status:'on_leave'}],
        ['pendingLeaveRequests','hr_leave_requests',{status:'pending'}], ['approvedLeaveRequests','hr_leave_requests',{status:'approved'}],
        ['rejectedLeaveRequests','hr_leave_requests',{status:'rejected'}],
      ],
    };

    const metrics = await Promise.all(definitions[kind as ReportKind].map(async ([label, table, filters]) => [label, await count(table, filters)] as const));
    const summary: Record<string, number | null> = Object.fromEntries(metrics);

    if (kind === 'attendance') {
      let query: any = client.from('attendance_records').select('attendance_status').limit(10000);
      if (parsedFrom) query = query.gte('created_at', parsedFrom.toISOString());
      if (parsedTo) query = query.lte('created_at', parsedToUpperBound!.toISOString());
      const { data, error } = await query;
      if (error) throw error;
      const rows = data ?? [];
      const present = rows.filter((row: { attendance_status: string }) => ['present','on_duty'].includes(row.attendance_status)).length;
      summary.attendanceRatePercent = rows.length ? Math.round((present / rows.length) * 1000) / 10 : null;
    }

    if (kind === 'academic') {
      let query: any = client.from('marks_records').select('student_id,marks_obtained,max_marks').in('status', ['verified','locked']).not('marks_obtained', 'is', null).limit(10000);
      if (departmentId) query = query.eq('department_id', departmentId);
      if (parsedFrom) query = query.gte('created_at', parsedFrom.toISOString());
      if (parsedTo) query = query.lte('created_at', parsedTo.toISOString());
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []).filter((row: { marks_obtained: number | string | null; max_marks: number | string | null }) => Number(row.max_marks) > 0 && Number.isFinite(Number(row.marks_obtained)));
      summary.averageVerifiedMarksPercent = rows.length ? Math.round(rows.reduce((sum: number, row: { marks_obtained: number | string; max_marks: number | string }) => sum + (Number(row.marks_obtained) / Number(row.max_marks)) * 100, 0) / rows.length * 10) / 10 : null;
    }

    if (kind === 'finance') {
      let invoiceQuery: any = client.from('fee_invoices').select('amount_due,amount_paid,status').limit(10000);
      let budgetQuery: any = client.from('finance_budgets').select('allocated_amount,status').limit(10000);
      if (parsedFrom) {
        invoiceQuery = invoiceQuery.gte('created_at', parsedFrom.toISOString());
        budgetQuery = budgetQuery.gte('created_at', parsedFrom.toISOString());
      }
      if (parsedTo) {
        invoiceQuery = invoiceQuery.lte('created_at', parsedToUpperBound!.toISOString());
        budgetQuery = budgetQuery.lte('created_at', parsedToUpperBound!.toISOString());
      }
      const [invoiceResult, budgetResult] = await Promise.all([invoiceQuery, budgetQuery]);
      if (invoiceResult.error) throw invoiceResult.error;
      if (budgetResult.error) throw budgetResult.error;
      const invoices = invoiceResult.data ?? [];
      const budgets = budgetResult.data ?? [];
      summary.invoiceAmountDue = Math.round(invoices.reduce((sum: number, row: { amount_due: number | string }) => sum + Number(row.amount_due || 0), 0) * 100) / 100;
      summary.invoiceAmountPaid = Math.round(invoices.reduce((sum: number, row: { amount_paid: number | string }) => sum + Number(row.amount_paid || 0), 0) * 100) / 100;
      summary.approvedBudgetAmount = Math.round(budgets.filter((row: { status: string }) => row.status === 'approved').reduce((sum: number, row: { allocated_amount: number | string }) => sum + Number(row.allocated_amount || 0), 0) * 100) / 100;
    }

    if (kind === 'accreditation') {
      let query: any = client.from('outcome_attainment_results').select('attained_percent').not('attained_percent', 'is', null).limit(10000);
      if (parsedFrom) query = query.gte('created_at', parsedFrom.toISOString());
      if (parsedTo) query = query.lte('created_at', parsedTo.toISOString());
      const { data, error } = await query;
      if (error) throw error;
      const values = (data ?? []).map((row: { attained_percent: number | string }) => Number(row.attained_percent)).filter((value: number) => Number.isFinite(value));
      summary.averageOutcomeAttainmentPercent = values.length ? Math.round(values.reduce((sum: number, value: number) => sum + value, 0) / values.length * 10) / 10 : null;
    }

    return { data: { kind, generatedAt: new Date().toISOString(), filters: { from: from || null, to: to || null, departmentId: departmentId || null }, metrics: summary } };
  }
}
