import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { DecideWorkflowDto, SubmitWorkflowDto } from './workflow.dto';

@Controller('workflows')
@UseGuards(SupabaseAuthGuard)
export class WorkflowsController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('status') status?: string, @Query('module') module?: string) {
    const client = this.db.forRequest(request);
    let query = client.from('workflow_requests')
      .select('id,institution_id,request_key,module,title,description,priority,status,department_id,requester_id,owner_id,due_at,payload,completed_at,created_at,updated_at')
      .order('created_at', { ascending: false }).limit(100);
    if (status && ['pending','approved','returned','rejected','completed','cancelled'].includes(status)) query = query.eq('status', status);
    if (module && ['task','leave','department','faculty','syllabus','timetable','attendance','examination','circular','events','documents','quality','policy','report','other'].includes(module)) query = query.eq('module', module);
    const { data, error } = await query;
    if (error) throw error;
    const rows = data ?? [];
    if (!rows.length) return { data: [], count: 0 };

    const requesterIds = [...new Set(rows.map((row) => row.requester_id).filter(Boolean))];
    const departmentIds = [...new Set(rows.map((row) => row.department_id).filter(Boolean))];
    const profileResult = requesterIds.length
      ? await client.from('profiles').select('user_id,full_name,title').in('user_id', requesterIds)
      : { data: [], error: null };
    if (profileResult.error) throw profileResult.error;
    const departmentResult = departmentIds.length
      ? await client.from('departments').select('id,name,code').in('id', departmentIds)
      : { data: [], error: null };
    if (departmentResult.error) throw departmentResult.error;
    const profiles = new Map((profileResult.data ?? []).map((profile) => [profile.user_id, profile]));
    const departments = new Map((departmentResult.data ?? []).map((department) => [department.id, department]));
    const enriched = rows.map((row) => ({
      ...row,
      requester_name: profiles.get(row.requester_id)?.full_name ?? null,
      requester_title: profiles.get(row.requester_id)?.title ?? null,
      department_name: departments.get(row.department_id)?.name ?? null,
    }));
    return { data: enriched, count: enriched.length };
  }

  @Post()
  async submit(@Req() request: AuthenticatedRequest, @Body() body: SubmitWorkflowDto) {
    const client = this.db.forRequest(request);
    const { data, error } = await client.rpc('submit_workflow', {
      p_module: body.module, p_title: body.title, p_description: body.description ?? null,
      p_department_id: body.departmentId ?? null, p_owner_id: body.ownerId ?? null,
      p_priority: body.priority ?? 'normal', p_due_at: body.dueAt ?? null,
      p_payload: body.payload ?? {}, p_approver_ids: body.approverIds ?? [],
    });
    if (error) throw error;
    return { id: data };
  }

  @Post(':id/decision')
  async decide(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: DecideWorkflowDto) {
    const client = this.db.forRequest(request);
    const { error } = await client.rpc('decide_workflow', {
      p_workflow_id: id, p_decision: body.decision, p_comment: body.comment ?? null,
    });
    if (error) throw error;
    return { id, decision: body.decision, ok: true };
  }
}
