import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards, NotFoundException, Delete } from '@nestjs/common';
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
} as const;

type ModuleKey = keyof typeof MODULES;

const STATUS_TRANSITIONS: Partial<Record<ModuleKey, Record<string, string[]>>> = {
  leave: { pending: ['approved', 'rejected', 'cancelled'], approved: [], rejected: [], cancelled: [] },
  procurement: { draft: ['submitted', 'cancelled'], submitted: ['approved', 'rejected', 'cancelled'], approved: ['ordered', 'cancelled'], rejected: ['draft', 'cancelled'], ordered: ['received'], received: [], cancelled: [] },
  workOrders: { open: ['assigned', 'in_progress', 'cancelled'], assigned: ['in_progress', 'blocked', 'cancelled'], in_progress: ['blocked', 'resolved', 'cancelled'], blocked: ['assigned', 'in_progress', 'cancelled'], resolved: ['closed', 'in_progress'], closed: [], cancelled: [] },
};

@Controller('operations')
@UseGuards(SupabaseAuthGuard)
export class OperationsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  private config(key: string) {
    if (!(key in MODULES)) throw new BadRequestException('Unknown operations module');
    return MODULES[key as ModuleKey];
  }

  private async institution(req: AuthenticatedRequest) {
    const client = this.db.forRequest(req);
    const { data, error } = await client.from('profiles').select('institution_id,status').eq('user_id', req.authUser!.id).maybeSingle();
    if (error) throw error;
    if (!data || data.status !== 'active') throw new BadRequestException('Active institutional access is required');
    return { client, institutionId: data.institution_id as string };
  }

  @Get(':module')
  async list(@Req() req: AuthenticatedRequest, @Param('module') module: string, @Query('status') status?: string, @Query('search') search?: string) {
    const config = this.config(module);
    const { client } = await this.institution(req);
    let query = client.from(config.table).select(config.select).order('created_at', { ascending: false }).limit(250);
    if (status && config.fields.includes('status' as never)) query = query.eq('status', status);
    if (search?.trim()) {
      const term = search.trim().replace(/[%_(),]/g, '').slice(0, 80);
      const searchable = config.fields.filter((field) => ['title','name','full_name','employee_code','request_number','ticket_number','asset_tag','registration_number','accession_number','project_code','criterion_code','building','room_number'].includes(field));
      if (term && searchable.length) query = query.or(searchable.map((field) => `${field}.ilike.%${term}%`).join(','));
    }
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [] };
  }

  @Post(':module')
  async create(@Req() req: AuthenticatedRequest, @Param('module') module: string, @Body() body: Record<string, unknown>) {
    const config = this.config(module);
    const { client, institutionId } = await this.institution(req);
    const values: Record<string, unknown> = {};
    for (const field of config.fields as readonly string[]) {
      if (body[field] !== undefined) values[field] = body[field];
    }
    if (!Object.keys(values).length) throw new BadRequestException('No supported fields were provided');
    values.institution_id = institutionId;
    if (['employees','catalogue','assets','employers','research','evidence'].includes(module)) values.created_by = req.authUser!.id;
    if (module === 'leave') values.created_by = req.authUser!.id;
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
    const { client } = await this.institution(req);
    const { data, error } = await client.from(config.table).delete().eq('id', id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Record not found or deletion is not permitted');
    return { deleted: true, id: data.id };
  }

  @Patch(':module/:id')
  async update(@Req() req: AuthenticatedRequest, @Param('module') module: string, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: Record<string, unknown>) {
    const config = this.config(module);
    const { client } = await this.institution(req);
    const patch: Record<string, unknown> = {};
    for (const field of config.fields as readonly string[]) {
      if (body[field] !== undefined) patch[field] = body[field];
    }
    if (!Object.keys(patch).length) throw new BadRequestException('No supported fields were provided');

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
    }

    const { data, error } = await client.from(config.table).update(patch).eq('id', id).select(config.select).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Record not found or update is not permitted');
    return data;
  }
}
