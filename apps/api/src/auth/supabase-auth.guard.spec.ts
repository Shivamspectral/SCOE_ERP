import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseAuthGuard } from './supabase-auth.guard';

describe('SupabaseAuthGuard', () => {
  const guard = new SupabaseAuthGuard({} as ConfigService);

  const contextFor = (headers: Record<string, string>) => ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  }) as unknown as ExecutionContext;

  it('rejects requests without a bearer token', async () => {
    await expect(guard.canActivate(contextFor({}))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects empty bearer tokens', async () => {
    await expect(guard.canActivate(contextFor({ authorization: 'Bearer   ' }))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
