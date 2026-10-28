import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards, NotFoundException, ForbiddenException, Delete } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

const MODULES = {
  employees: { table: 'hr_employees', select: 'id,employee_code,full_name,department_id,designation,employment_type,joining_date,employment_status,work_email,phone,qualifications,service_metadata,created_at,updated_at', fields: ['employee_code','full_name','department_id','designation','employment_type','joining_date','employment_status','work_email','phone','qualifications','service_metadata'] },
  leave: { table: 'hr_leave_requests', select: 'id,employee_id,leave_type,starts_on,ends_on,days,reason,status,reviewer_id,reviewed_at,review_note,created_at,updated_at', fields: ['employee_id','leave_type','starts_on','ends_on','days','reason','status','review_note'] },
  procurement: { table: 'procurement_requests', select: 'id,department_id,request_number,title,description,vendor_name,estimated_amount,currency,priority,status,requested_by,reviewed_by,reviewed_at,review_note,items,created_at,updated_at', fields: ['department_id','request_number','title','description','vendor_name','estimated_amount','currency','priority','status','review_note','items'] },
  catalogue: { table: 'library_catalogue_items', select: 'id,accession_number,isbn,title,authors,publisher,publication_year,category,shelf_location,total_copies,available_copies,item_type,status,created_at,updated_at', fields: ['accession_number','isbn','title','authors','publisher','publication_year','category','shelf_location','total_copies','available_copies','item_type','status'] },
  workOrders: { table: 'campus_work_orders', select: 'id,ticket_number,category,location,title,description,priority,status,assigned_to,reported_by,due_at,resolved_at,resolution_note,created_at,updated_at', fields: ['ticket_number','category','location','title','description','priority','status','assigned_to','due_at','resolved_at','resolution_note'] },
  assets: { table: 'campus_assets', select: 'id,asset_tag,name,category,department_id,location,serial_number,purchase_date,purchase_cost,warranty_until,condition,status,metadata,created_at,updated_at', fields: ['asset_tag','name','category','department_id','location','serial_number','purchase_date','purchase_cost','warranty_until','condition','status','metadata'] },
  hostelRooms: { table: 'hostel_rooms', select: 'id,building,room_number,floor_label,capacity,occupied_beds,room_type,status,notes,created_at,updated_at', fields: ['building','room_number','floor_label','capacity','occupied_beds','room_type','status','notes'] },
  vehicles: { table: 'transport_vehicles', select: 'id,vehicle_code,registration_number,vehicle_type,capacity,driver_name,driver_phone,permit_expires_on,insurance_expires_on,last_service_on,next_service_on,status,route_details,created_at,updated_at', fields: ['vehicle_code','registration_number','vehicle_type','capacity','driver_name','driver_phone','permit_expires_on','insurance_expires_on','last_service_on','next_service_on','status','route_details'] },
  employers: { table: 'placement_employers', select: 'id,name,industry,website,contact_name,contact_email,contact_phone,relationship_status,notes,created_at,updated_at', fields: ['name','industry','website','contact_name','contact_email','contact_phone','relationship_status','notes'] },
  drives: { table: 'placement_drives', select: 'id,employer_id,title,job_role,eligible_programmes,minimum_cgpa,package_min_lpa,package_max_lpa,drive_date,registration_deadline,vacancies,status,outcome_summary,created_at,updated_at', fields: ['employer_id','title','job_role','eligible_programmes','minimum_cgpa','package_min_lpa','package_max_lpa','drive_date','registration_deadline','vacancies','status','outcome_summary'] },
  research: { table: 'research_projects', select: 'id,department_id,project_code,title,principal_investigator,funding_agency,grant_amount,currency,starts_on,ends_on,status,outputs,metadata,created_at,updated_at', fields: ['department_id','project_code','title','principal_investigator','funding_agency','grant_amount','currency','starts_on','ends_on','status','outputs','metadata'] },
  evidence: { table: 'accreditation_evidence', select: 'id,framework,cycle_label,criterion_code,title,description,owner_department_id,owner_user_id,evidence_document_id,reporting_period,status,metrics,reviewed_by,reviewed_at,review_note,created_at,updated_at', fields: ['framework','cycle_label','criterion_code','title','description','owner_department_id','owner_user_id','evidence_document_id','reporting_period','status','metrics','review_note'] },
  events: { table: 'institution_events', select: 'id,title,event_type,description,venue,starts_at,ends_at,organizer_department_id,coordinator_id,capacity,status,metadata,created_at,updated_at', fields: ['title','event_type','description','venue','starts_at','ends_at','organizer_department_id','coordinator_id','capacity','status','metadata'] },
  committees: { table: 'institution_committees', select: 'id,committee_code,name,committee_type,purpose,chairperson_id,department_id,starts_on,ends_on,status,meeting_frequency,metadata,created_at,updated_at', fields: ['committee_code','name','committee_type','purpose','chairperson_id','department_id','starts_on','ends_on','status','meeting_frequency','metadata'] },
  committeeMembers: { table: 'institution_committee_members', select: 'id,committee_id,user_id,member_name,designation,member_role,appointed_on,ends_on,status,created_at,updated_at', fields: ['committee_id','user_id','member_name','designation','member_role','appointed_on','ends_on','status'] },
  clubsAdmin: { table: 'institution_clubs', select: 'id,club_code,name,category,description,faculty_coordinator_id,annual_budget,founded_on,status,metadata,created_at,updated_at', fields: ['club_code','programme_code','academic_year','term_code','outcome_code','cohort_label','budget_code','claim_number','legal_name','vendor_code','application_number','applicant_name','campaign_code','name','category','description','faculty_coordinator_id','annual_budget','founded_on','status','metadata'] },
  alumniRecords: { table: 'alumni_records', select: 'id,alumni_code,full_name,graduation_year,programme,department_id,current_employer,current_designation,work_email,contact_phone,linkedin_url,mentorship_available,donation_total,notes,status,created_at,updated_at', fields: ['alumni_code','full_name','graduation_year','programme','department_id','current_employer','current_designation','work_email','contact_phone','linkedin_url','mentorship_available','donation_total','notes','status'] },
  labInventory: { table: 'lab_inventory', select: 'id,asset_tag,name,department_id,laboratory,category,quantity,condition,calibration_due_on,last_service_on,assigned_to,purchase_cost,status,notes,created_at,updated_at', fields: ['asset_tag','name','department_id','laboratory','category','quantity','condition','calibration_due_on','last_service_on','assigned_to','purchase_cost','status','notes'] },
  sportsFacilities: { table: 'sports_facilities', select: 'id,facility_code,name,facility_type,location,capacity,opening_time,closing_time,supervisor_id,status,notes,created_at,updated_at', fields: ['facility_code','name','facility_type','location','capacity','opening_time','closing_time','supervisor_id','status','notes'] },
  visitors: { table: 'visitor_register', select: 'id,visitor_name,organisation,phone,email,purpose,host_user_id,host_department_id,badge_number,checked_in_at,checked_out_at,status,notes,created_at,updated_at', fields: ['visitor_name','organisation','phone','email','purpose','host_user_id','host_department_id','badge_number','checked_in_at','checked_out_at','status','notes'] },
  programmes: { table: 'academic_programmes', select: 'id,department_id,programme_code,name,award_level,duration_years,approved_intake,regulator,accreditation_status,status,metadata,created_at,updated_at', fields: ['department_id','programme_code','name','award_level','duration_years','approved_intake','regulator','accreditation_status','status'] },
  academicTerms: { table: 'academic_terms', select: 'id,academic_year,term_code,name,starts_on,ends_on,is_current,status,created_at,updated_at', fields: ['academic_year','term_code','name','starts_on','ends_on','is_current','status'] },
  curriculumCourses: { table: 'curriculum_courses', select: 'id,programme_id,subject_id,term_id,course_type,credits,lecture_hours,tutorial_hours,practical_hours,sequence_no,status,created_at,updated_at', fields: ['programme_id','subject_id','term_id','course_type','credits','lecture_hours','tutorial_hours','practical_hours','sequence_no','status'] },
  courseOutcomes: { table: 'course_outcomes', select: 'id,subject_id,outcome_code,description,proficiency_target,status,created_at,updated_at', fields: ['subject_id','outcome_code','description','proficiency_target','status'] },
  programOutcomes: { table: 'program_outcomes', select: 'id,programme_id,outcome_code,description,status,created_at,updated_at', fields: ['programme_id','outcome_code','description','status'] },
  outcomeMappings: { table: 'course_program_outcome_mappings', select: 'id,course_outcome_id,program_outcome_id,correlation_level,rationale,created_at,updated_at', fields: ['course_outcome_id','program_outcome_id','correlation_level','rationale'] },
  attainmentCycles: { table: 'outcome_attainment_cycles', select: 'id,programme_id,term_id,cycle_label,cohort_label,methodology,status,approved_by,approved_at,review_note,created_at,updated_at', fields: ['programme_id','term_id','cycle_label','cohort_label','methodology','status','review_note'] },
  attainmentResults: { table: 'outcome_attainment_results', select: 'id,cycle_id,outcome_type,outcome_id,attained_percent,target_percent,sample_size,evidence,created_at,updated_at', fields: ['cycle_id','outcome_type','outcome_id','attained_percent','target_percent','sample_size','evidence'] },
  institutionSettings: { table: 'institution_settings', select: 'id,academic_year_label,academic_year_starts_on,academic_year_ends_on,default_currency,locale,timezone,contact_email,contact_phone,address,branding,enabled_modules,notification_settings,updated_by,created_by,created_at,updated_at', fields: ['academic_year_label','academic_year_starts_on','academic_year_ends_on','default_currency','locale','timezone','contact_email','contact_phone','address','branding','notification_settings'] },
  budgets: { table: 'finance_budgets', select: 'id,fiscal_year,budget_code,title,department_id,allocated_amount,currency,status,approved_by,approved_at,notes,created_by,created_at,updated_at', fields: ['fiscal_year','budget_code','title','department_id','allocated_amount','currency','status','notes'] },
  vendors: { table: 'vendor_registry', select: 'id,vendor_code,legal_name,gstin,vendor_type,contact_name,contact_email,contact_phone,address,payment_terms,status,reviewed_by,reviewed_at,notes,created_by,created_at,updated_at', fields: ['vendor_code','legal_name','gstin','vendor_type','contact_name','contact_email','contact_phone','payment_terms','status','notes'] },
  expenseClaims: { table: 'expense_claims', select: 'id,claim_number,employee_id,expense_category,amount,currency,incurred_on,description,receipt_document_id,status,submitted_by,reviewed_by,reviewed_at,paid_at,review_note,created_at,updated_at', fields: ['claim_number','employee_id','expense_category','amount','currency','incurred_on','description','receipt_document_id','status','review_note'] },
  admissionCampaigns: { table: 'admission_campaigns', select: 'id,campaign_code,name,academic_year,starts_on,ends_on,status,notes,created_by,created_at,updated_at', fields: ['campaign_code','name','academic_year','starts_on','ends_on','status','notes'] },
  admissionApplications: { table: 'admission_applications', select: 'id,application_number,campaign_id,programme_id,applicant_name,email,phone,date_of_birth,applicant_category,qualifying_exam,qualifying_board,passing_year,qualifying_percentage,entrance_exam,entrance_score,application_fee_status,status,document_refs,assigned_reviewer,reviewed_at,decision_note,created_by,created_at,updated_at', fields: ['application_number','campaign_id','programme_id','applicant_name','email','phone','date_of_birth','applicant_category','qualifying_exam','qualifying_board','passing_year','qualifying_percentage','entrance_exam','entrance_score','application_fee_status','status','decision_note'] },
} as const;

type ModuleKey = keyof typeof MODULES;

const STATUS_TRANSITIONS: Partial<Record<ModuleKey, Record<string, string[]>>> = {
  leave: { pending: ['approved', 'rejected', 'cancelled'], approved: [], rejected: [], cancelled: [] },
  procurement: { draft: ['submitted', 'cancelled'], submitted: ['approved', 'rejected', 'cancelled'], approved: ['ordered', 'cancelled'], rejected: ['draft', 'cancelled'], ordered: ['received'], received: [], cancelled: [] },
  workOrders: { open: ['assigned', 'in_progress', 'cancelled'], assigned: ['in_progress', 'blocked', 'cancelled'], in_progress: ['blocked', 'resolved', 'cancelled'], blocked: ['assigned', 'in_progress', 'cancelled'], resolved: ['closed', 'in_progress'], closed: [], cancelled: [] },
  committees: { draft: ['active', 'archived'], active: ['inactive', 'archived'], inactive: ['active', 'archived'], archived: [] },
  committeeMembers: { active: ['inactive', 'completed'], inactive: ['active', 'completed'], completed: [] },
  clubsAdmin: { proposed: ['active', 'inactive'], active: ['inactive', 'archived'], inactive: ['active', 'archived'], archived: [] },
  alumniRecords: { active: ['inactive', 'do_not_contact'], inactive: ['active', 'do_not_contact'], do_not_contact: ['inactive'] },
  labInventory: { available: ['in_use', 'maintenance', 'retired', 'disposed'], in_use: ['available', 'maintenance', 'retired'], maintenance: ['available', 'in_use', 'retired', 'disposed'], retired: ['disposed'], disposed: [] },
  sportsFacilities: { available: ['booked', 'maintenance', 'closed'], booked: ['available', 'maintenance', 'closed'], maintenance: ['available', 'closed'], closed: ['available'] },
  visitors: { expected: ['checked_in', 'denied'], checked_in: ['checked_out'], checked_out: [], denied: [] },
  events: { draft: ['planned', 'cancelled'], planned: ['published', 'cancelled'], published: ['completed', 'cancelled'], completed: [], cancelled: [] },
  evidence: { draft: ['in_progress', 'archived'], in_progress: ['submitted_for_review', 'archived'], submitted_for_review: ['approved', 'needs_revision'], needs_revision: ['in_progress', 'archived'], approved: ['archived'], archived: [] },
  programmes: { draft: ['active', 'archived'], active: ['suspended', 'archived'], suspended: ['active', 'archived'], archived: [] },
  academicTerms: { planned: ['active', 'cancelled'], active: ['completed', 'cancelled'], completed: [], cancelled: [] },
  curriculumCourses: { draft: ['active', 'archived'], active: ['archived'], archived: [] },
  courseOutcomes: { draft: ['active', 'archived'], active: ['archived'], archived: [] },
  programOutcomes: { draft: ['active', 'archived'], active: ['archived'], archived: [] },
  attainmentCycles: { draft: ['calculating', 'archived'], calculating: ['submitted_for_review', 'reopened'], submitted_for_review: ['approved', 'reopened'], approved: ['reopened', 'archived'], reopened: ['calculating', 'archived'], archived: [] },
  budgets: { draft: ['submitted'], submitted: ['approved', 'draft'], approved: ['locked'], locked: ['closed'], closed: [] },
  vendors: { pending_review: ['approved', 'suspended', 'blacklisted'], approved: ['suspended', 'blacklisted'], suspended: ['approved', 'blacklisted'], blacklisted: [] },
  expenseClaims: { draft: ['submitted', 'cancelled'], submitted: ['approved', 'rejected', 'cancelled'], approved: ['paid'], rejected: ['draft', 'cancelled'], paid: [], cancelled: [] },
  catalogue: { active: ['processing', 'withdrawn'], processing: ['active', 'withdrawn'], withdrawn: [] },
  assets: { active: ['under_maintenance', 'lost', 'disposed'], under_maintenance: ['active', 'disposed'], lost: ['active', 'disposed'], disposed: [] },
  hostelRooms: { available: ['full', 'maintenance', 'inactive'], full: ['available', 'maintenance', 'inactive'], maintenance: ['available', 'inactive'], inactive: ['available'] },
  vehicles: { active: ['maintenance', 'retired'], maintenance: ['active', 'retired'], retired: [] },
  drives: { planned: ['open', 'cancelled'], open: ['in_progress', 'cancelled'], in_progress: ['completed', 'cancelled'], completed: [], cancelled: [] },
  research: { proposed: ['submitted', 'rejected'], submitted: ['active', 'rejected', 'on_hold'], active: ['on_hold', 'completed'], on_hold: ['active', 'completed'], completed: [], rejected: [] },
  admissionCampaigns: { draft: ['open', 'archived'], open: ['closed', 'archived'], closed: ['open', 'archived'], archived: [] },
  admissionApplications: { submitted: ['documents_pending', 'under_review', 'withdrawn'], documents_pending: ['under_review', 'withdrawn'], under_review: ['shortlisted', 'offered', 'waitlisted', 'rejected', 'withdrawn'], shortlisted: ['offered', 'waitlisted', 'rejected', 'withdrawn'], offered: ['accepted', 'rejected', 'withdrawn'], waitlisted: ['offered', 'rejected', 'withdrawn'], accepted: [], rejected: [], withdrawn: [] },
};

@Controller('operations')
@UseGuards(SupabaseAuthGuard)
export class OperationsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  private config(key: string) {
    if (!(key in MODULES)) throw new BadRequestException('Unknown operations module');
    return MODULES[key as ModuleKey];
  }

  private async institution(req: AuthenticatedRequest, module?: string) {
    const client = this.db.forRequest(req);
    const { data, error } = await client.from('profiles').select('institution_id,status').eq('user_id', req.authUser!.id).maybeSingle();
    if (error) throw error;
    if (!data || data.status !== 'active') throw new BadRequestException('Active institutional access is required');
    const institutionId = data.institution_id as string;
    if (module && module !== 'institutionSettings') {
      const { data: settings, error: settingsError } = await client.from('institution_settings').select('enabled_modules').eq('institution_id', institutionId).maybeSingle();
      if (settingsError) throw settingsError;
      const enabledModules = Array.isArray(settings?.enabled_modules) ? settings.enabled_modules as string[] : [];
      if (enabledModules.length > 0 && !enabledModules.includes(module)) {
        throw new ForbiddenException('This module is not enabled for your institution subscription');
      }
    }
    return { client, institutionId };
  }

  @Get(':module')
  async list(@Req() req: AuthenticatedRequest, @Param('module') module: string, @Query('status') status?: string, @Query('search') search?: string) {
    const config = this.config(module);
    const { client } = await this.institution(req, module);
    let query = client.from(config.table).select(config.select).order('created_at', { ascending: false }).limit(250);
    if (status && config.fields.includes('status' as never)) query = query.eq('status', status);
    if (search?.trim()) {
      const term = search.trim().replace(/[%_(),]/g, '').slice(0, 80);
      const searchable = config.fields.filter((field) => ['title','name','full_name','employee_code','request_number','ticket_number','asset_tag','registration_number','accession_number','project_code','criterion_code','building','room_number','committee_code','alumni_code','laboratory','visitor_name','facility_code','club_code'].includes(field));
      if (term && searchable.length) query = query.or(searchable.map((field) => `${field}.ilike.%${term}%`).join(','));
    }
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [] };
  }

  @Post(':module')
  async create(@Req() req: AuthenticatedRequest, @Param('module') module: string, @Body() body: Record<string, unknown>) {
    const config = this.config(module);
    const { client, institutionId } = await this.institution(req, module);
    const values: Record<string, unknown> = {};
    for (const field of config.fields as readonly string[]) {
      if (body[field] !== undefined) values[field] = body[field];
    }
    if (!Object.keys(values).length) throw new BadRequestException('No supported fields were provided');
    values.institution_id = institutionId;
    if (['employees','catalogue','assets','employers','research','evidence','admissionCampaigns','admissionApplications'].includes(module)) values.created_by = req.authUser!.id;
    if (module === 'leave') values.created_by = req.authUser!.id;
    if (module === 'expenseClaims') values.submitted_by = req.authUser!.id;
    if (module === 'procurement') values.requested_by = req.authUser!.id;
    if (module === 'workOrders') values.reported_by = req.authUser!.id;
    const { data, error } = await client.from(config.table).insert(values).select(config.select).single();
    if (error?.code === '23505') throw new BadRequestException('A record with this unique identifier already exists');
    if (error) throw error;
    return data;
  }

  @Delete(':module/:id')
  async remove(@Req() req: AuthenticatedRequest, @Param('module') module: string, @Param('id', new ParseUUIDPipe()) id: string) {
    const config = this.config(module);
    const { client } = await this.institution(req, module);
    const { data, error } = await client.from(config.table).delete().eq('id', id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Record not found or deletion is not permitted');
    return { deleted: true, id: data.id };
  }

  @Patch(':module/:id')
  async update(@Req() req: AuthenticatedRequest, @Param('module') module: string, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: Record<string, unknown>) {
    const config = this.config(module);
    const { client } = await this.institution(req, module);
    const patch: Record<string, unknown> = {};
    for (const field of config.fields as readonly string[]) {
      if (body[field] !== undefined) patch[field] = body[field];
    }
    if (!Object.keys(patch).length) throw new BadRequestException('No supported fields were provided');
    if (module === 'institutionSettings') patch.updated_by = req.authUser!.id;

    if (typeof patch.status === 'string' && STATUS_TRANSITIONS[module as ModuleKey]) {
      const { data: current, error: readError } = await client.from(config.table).select('status').eq('id', id).maybeSingle();
      if (readError) throw readError;
      if (!current) throw new NotFoundException('Record not found or update is not permitted');
      const currentStatus = String(current.status ?? 'draft');
      const nextStatus = String(patch.status);
      if (currentStatus !== nextStatus && !(STATUS_TRANSITIONS[module as ModuleKey]?.[currentStatus] ?? []).includes(nextStatus)) {
        throw new BadRequestException('Invalid status transition: ' + currentStatus + ' -> ' + nextStatus);
      }
      if (currentStatus !== nextStatus && module === 'leave' && ['approved','rejected'].includes(nextStatus)) {
        patch.reviewer_id = req.authUser!.id;
        patch.reviewed_at = new Date().toISOString();
      }
      if (currentStatus !== nextStatus && module === 'procurement' && ['approved','rejected'].includes(nextStatus)) {
        patch.reviewed_by = req.authUser!.id;
        patch.reviewed_at = new Date().toISOString();
      }
      if (currentStatus !== nextStatus && module === 'workOrders') {
        if (nextStatus === 'resolved') patch.resolved_at = new Date().toISOString();
        if (currentStatus === 'resolved' && nextStatus === 'in_progress') patch.resolved_at = null;
      }
      if (currentStatus !== nextStatus && module === 'visitors') {
        if (nextStatus === 'checked_in') patch.checked_in_at = new Date().toISOString();
        if (nextStatus === 'checked_out') patch.checked_out_at = new Date().toISOString();
      }
      if (currentStatus !== nextStatus && module === 'attainmentCycles') {
        if (nextStatus === 'approved') {
          patch.approved_by = req.authUser!.id;
          patch.approved_at = new Date().toISOString();
        }
        if (nextStatus === 'reopened') {
          patch.approved_by = null;
          patch.approved_at = null;
        }
      }
      if (currentStatus !== nextStatus && module === 'budgets' && nextStatus === 'approved') {
        patch.approved_by = req.authUser!.id;
        patch.approved_at = new Date().toISOString();
      }
      if (currentStatus !== nextStatus && module === 'vendors' && ['approved','suspended','blacklisted'].includes(nextStatus)) {
        patch.reviewed_by = req.authUser!.id;
        patch.reviewed_at = new Date().toISOString();
      }
      if (currentStatus !== nextStatus && module === 'expenseClaims') {
        if (['approved','rejected'].includes(nextStatus)) {
          patch.reviewed_by = req.authUser!.id;
          patch.reviewed_at = new Date().toISOString();
        }
        if (nextStatus === 'paid') patch.paid_at = new Date().toISOString();
      }
      if (currentStatus !== nextStatus && module === 'admissionApplications' && ['under_review','shortlisted','offered','accepted','waitlisted','rejected'].includes(nextStatus)) {
        patch.assigned_reviewer = req.authUser!.id;
        patch.reviewed_at = new Date().toISOString();
      }
    }

    const { data, error } = await client.from(config.table).update(patch).eq('id', id).select(config.select).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Record not found or update is not permitted');
    return data;
  }
}
