import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

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
      notices, submittedSessions, totalAttendance, presentAttendance, onDutyAttendance,
      assignmentCount, roleRows, markRows,
    ] = await Promise.all([
      count('academic_students', { status: 'active' }),
      count('departments', { status: 'active' }),
      count('academic_classes', { status: 'active' }),
      count('academic_subjects', { status: 'active' }),
      count('workflow_requests', { status: 'pending' }),
      count('workflow_requests', { status: 'pending', module: 'task' }),
      count('circulars', { status: 'published' }),
      count('attendance_sessions', { status: 'submitted' }),
      count('attendance_records'),
      count('attendance_records', { attendance_status: 'present' }),
      count('attendance_records', { attendance_status: 'on_duty' }),
      count('assignment_records'),
      client.from('role_assignments').select('user_id').eq('role', 'faculty').eq('status', 'active').limit(5000),
      client.from('marks_records').select('student_id,marks_obtained').not('marks_obtained', 'is', null).limit(10000),
    ]);
    if (roleRows.error) throw roleRows.error;
    if (markRows.error) throw markRows.error;
    const faculty = new Set((roleRows.data ?? []).map((row) => row.user_id)).size;
    const marks = (markRows.data ?? []).map((row) => Number(row.marks_obtained)).filter(Number.isFinite);
    const averageScore = marks.length ? Math.round((marks.reduce((sum, value) => sum + value, 0) / marks.length) * 10) / 10 : null;
    const lowScoreStudents = new Set((markRows.data ?? []).filter((row) => Number(row.marks_obtained) < 40).map((row) => row.student_id)).size;
    const attendanceRate = totalAttendance ? Math.round(((presentAttendance + onDutyAttendance) / totalAttendance) * 1000) / 10 : null;

    return {
      students, faculty, departments, classes, subjects, assignments: assignmentCount,
      mentees: 0, pendingApprovals, pendingTasks, notices, attendanceSessions: submittedSessions,
      attendanceRate, averageScore, lowScoreStudents,
      averageCgpa: null, backlogStudents: null, averageBacklogs: null,
    };
  }
}
