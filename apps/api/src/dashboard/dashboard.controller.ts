import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

export function summarizeVerifiedMarks(
  rows: Array<{ student_id: string | null; marks_obtained: number | string | null; max_marks: number | string | null }>,
) {
  const scoredRows = rows.map((row) => {
    const hasMarks = row.marks_obtained !== null && row.marks_obtained !== undefined && row.marks_obtained !== "";
    const hasMaximum = row.max_marks !== null && row.max_marks !== undefined && row.max_marks !== "";
    const obtained = Number(row.marks_obtained);
    const maximum = Number(row.max_marks);
    return {
      studentId: row.student_id,
      percentage: hasMarks && hasMaximum && Number.isFinite(obtained) && Number.isFinite(maximum) && maximum > 0
        ? (obtained / maximum) * 100
        : null,
    };
  }).filter((row) => row.percentage !== null);
  const averageScore = scoredRows.length
    ? Math.round((scoredRows.reduce((sum, row) => sum + row.percentage!, 0) / scoredRows.length) * 10) / 10
    : null;
  const lowScoreStudents = new Set(scoredRows.filter((row) => row.percentage! < 40 && row.studentId).map((row) => row.studentId)).size;
  return { averageScore, lowScoreStudents };
}

@Controller('dashboard')
@UseGuards(SupabaseAuthGuard)
export class DashboardController {
  constructor(private readonly db: SupabaseRequestClient) {}

  @Get('summary')
  async summary(@Req() request: AuthenticatedRequest) {
    const client = this.db.forRequest(request);
    const count = async (table: string, filters: Record<string, unknown> = {}) => {
      let query: any = client.from(table).select('id', { count: 'exact', head: true });
      for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
      const { count: total, error } = await query;
      if (error) throw error;
      return total ?? 0;
    };

    const [
      students, departments, classes, subjects, pendingApprovals, pendingTasks,
      notices, submittedSessions, totalAttendance, presentAttendance, lateAttendance,
      assignmentCount, examSessionsPublished, applicationsUnderReview, openAdmissionCampaigns, roleRows, markRows,
    ] = await Promise.all([
      count('academic_students', { status: 'active' }),
      count('departments', { status: 'active' }),
      count('academic_classes', { status: 'active' }),
      count('academic_subjects', { status: 'active' }),
      count('workflow_requests', { status: 'pending' }),
      count('faculty_workspace_records', { status: 'draft', resource: 'tasks' }),
      count('circulars', { status: 'published' }),
      count('attendance_sessions', { status: 'submitted' }),
      count('attendance_records'),
      count('attendance_records', { attendance_status: 'present' }),
      count('attendance_records', { attendance_status: 'late' }),
      count('assignment_records'),
      count('examination_sessions', { status: 'published' }),
      count('admission_applications', { status: 'under_review' }),
      count('admission_campaigns', { status: 'open' }),
      client.from('role_assignments').select('user_id').eq('role', 'faculty').eq('status', 'active').limit(5000),
      client.from('marks_records').select('student_id,marks_obtained,max_marks').not('marks_obtained', 'is', null).in('status', ['verified', 'locked']).limit(10000),
    ]);
    if (roleRows.error) throw roleRows.error;
    if (markRows.error) throw markRows.error;
    const faculty = new Set((roleRows.data ?? []).map((row) => row.user_id)).size;
    const { averageScore, lowScoreStudents } = summarizeVerifiedMarks(markRows.data ?? []);
    const attendanceRate = totalAttendance ? Math.round(((presentAttendance + lateAttendance) / totalAttendance) * 1000) / 10 : null;

    return {
      students, faculty, departments, classes, subjects, assignments: assignmentCount,
      mentees: null, pendingApprovals, pendingTasks, notices, attendanceSessions: submittedSessions,
      attendanceRate, averageScore, lowScoreStudents,
      examSessionsPublished, applicationsUnderReview, openAdmissionCampaigns,
      averageCgpa: null, backlogStudents: null, averageBacklogs: null,
    };
  }
}
