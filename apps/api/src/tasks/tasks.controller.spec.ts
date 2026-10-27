import { ForbiddenException } from '@nestjs/common';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { TasksController } from './tasks.controller';

function query(result: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
}

function makeController(profile: Record<string, unknown> | null, roles: Array<{ role: string; department_id: string | null }>, department: Record<string, unknown> | null) {
  const profileQuery = query({ data: profile, error: null });
  const rolesQuery = query({ data: roles, error: null });
  const departmentQuery = query({ data: department, error: null });
  const client = {
    from: jest.fn((table: string) => table === 'profiles' ? profileQuery : table === 'role_assignments' ? rolesQuery : departmentQuery),
  };
  const db = { forRequest: jest.fn(() => client) };
  return new TasksController(db as unknown as SupabaseRequestClient);
}

describe('TasksController authorization scope', () => {
  const request = { authUser: { id: 'staff-1' } } as any;
  const profile = { institution_id: 'inst-1', department_id: 'dept-1', status: 'active' };
  const department = { id: 'dept-1', institution_id: 'inst-1', status: 'active' };

  it('rejects staff without an authorized teaching or leadership role', async () => {
    const subject = makeController(profile, [{ role: 'staff', department_id: 'dept-1' }], department);
    await expect((subject as any).taskScope(request)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a task department outside the caller role assignment', async () => {
    const subject = makeController(profile, [{ role: 'faculty', department_id: 'dept-1' }], department);
    await expect((subject as any).taskScope(request, 'dept-2')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('accepts active faculty assigned to the selected active department', async () => {
    const subject = makeController(profile, [{ role: 'faculty', department_id: 'dept-1' }], department);
    await expect((subject as any).taskScope(request)).resolves.toMatchObject({
      institutionId: 'inst-1',
      departmentId: 'dept-1',
      userId: 'staff-1',
    });
  });
});
