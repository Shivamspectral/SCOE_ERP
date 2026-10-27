import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { UsersController } from './users.controller';

function mockRequestClient(profile: Record<string, unknown> | null, roles: Array<{ role: string }>) {
  const profileQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null }),
  };
  const roleQuery: {
    select: jest.Mock;
    eq: jest.Mock;
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise<unknown>;
  } = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    then: (resolve, reject) => Promise.resolve({ data: roles, error: null }).then(resolve, reject),
  };
  const client = {
    from: jest.fn((table: string) => table === 'profiles' ? profileQuery : roleQuery),
  };
  return client;
}

describe('UsersController staff-management authorization', () => {
  const userId = '8e1f8c3d-7e6c-4a2a-9d4c-1b6d1b8a2f31';
  const activeProfile = {
    user_id: userId,
    institution_id: 'institution-1',
    department_id: null,
    status: 'active',
  };

  function controller() {
    return new UsersController({} as SupabaseRequestClient, {} as ConfigService);
  }

  it('rejects staff with no active Principal or Administrator role', async () => {
    const subject = controller();
    const client = mockRequestClient(activeProfile, []);

    await expect(
      (subject as any).requireManager(client, userId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects suspended institutional profiles even if role rows exist', async () => {
    const subject = controller();
    const client = mockRequestClient({ ...activeProfile, status: 'suspended' }, [{ role: 'principal' }]);

    await expect(
      (subject as any).requireManager(client, userId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an active Administrator to enter the staff-management flow', async () => {
    const subject = controller();
    const client = mockRequestClient(activeProfile, [{ role: 'administrator' }]);

    await expect(
      (subject as any).requireManager(client, userId),
    ).resolves.toMatchObject({ isPrincipal: false, isAdministrator: true });
  });

  it('identifies the Principal separately so elevated-role actions can be restricted', async () => {
    const subject = controller();
    const client = mockRequestClient(activeProfile, [{ role: 'principal' }]);

    await expect(
      (subject as any).requireManager(client, userId),
    ).resolves.toMatchObject({ isPrincipal: true, isAdministrator: false });
  });
});
