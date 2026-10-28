import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
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
  async generate(@Req() req: AuthenticatedRequest, @Query('from') from?: string, @Query('to') to?: string, @Query('departmentId') departmentId?: string) {
    const kind = (req as any).params?.kind as string;
    return this.buildReport(req, kind, from, to, departmentId);
  }

  private async buildReport(req: AuthenticatedRequest, kind: string, from?: string, to?: string, departmentId?: string) {
    if (!REPORT_KINDS.includes(kind as ReportKind)) throw new BadRequestException('Unsupported report kind');
    const client = this.db.forRequest(req);
    const { data: profile, error: profileError } = await client.from('profiles').select('institution_id,status').eq('user_id', req.authUser!.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.status !== 'active') throw new BadRequestException('Active institutional access is required');

    const count = async (table: string, filters: Record<string, string> = {}) => {
      let query: any = client.from(table).select('id', { count: 'exact', head: true });
      if (departmentId && ['academic_classes','academic_subjects','academic_students','attendance_sessions','marks_records','academic_programmes','finance_budgets','hr_employees','research_projects'].includes(table)) query = query.eq('department_id', departmentId);
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
        ['overdueLoans','library_loans',{status:'overdue'}],
      ],
      hr: [
        ['activeEmployees','hr_employees',{employment_status:'active'}], ['employeesOnLeave','hr_employees',{employment_status:'on_leave'}],
        ['pendingLeaveRequests','hr_leave_requests',{status:'pending'}], ['approvedLeaveRequests','hr_leave_requests',{status:'approved'}],
        ['rejectedLeaveRequests','hr_leave_requests',{status:'rejected'}],
      ],
    };

    const metrics = await Promise.all(definitions[kind as ReportKind].map(async ([label, table, filters]) => [label, await count(table, filters)] as const));
    const summary = Object.fromEntries(metrics);
    return { data: { kind, generatedAt: new Date().toISOString(), filters: { from: from || null, to: to || null, departmentId: departmentId || null }, metrics: summary } };
  }
}
