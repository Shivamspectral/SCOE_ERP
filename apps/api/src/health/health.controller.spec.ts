import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const values: Record<string, string | undefined> = {};
  let subject: HealthController;
  const originalFetch = global.fetch;

  beforeEach(() => {
    Object.keys(values).forEach((key) => delete values[key]);
    subject = new HealthController({
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService);
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('keeps liveness independent of database availability', () => {
    expect(subject.getHealth()).toMatchObject({ status: 'ok', service: 'astra-campus-api' });
  });

  it('reports degraded readiness when provider configuration is missing', async () => {
    await expect(subject.getReadiness()).resolves.toMatchObject({
      status: 'degraded',
      checks: { api: 'ok', database: 'not-configured' },
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('checks the configured Supabase Auth health endpoint', async () => {
    values.SUPABASE_URL = 'https://example.supabase.co/';
    values.SUPABASE_PUBLISHABLE_KEY = 'public-test-key';
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await expect(subject.getReadiness()).resolves.toMatchObject({
      status: 'ok',
      checks: { api: 'ok', database: 'reachable' },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/health',
      expect.objectContaining({
        method: 'GET',
        headers: { apikey: 'public-test-key' },
      }),
    );
  });

  it('does not expose provider details when readiness checks fail', async () => {
    values.SUPABASE_URL = 'https://example.supabase.co';
    values.SUPABASE_PUBLISHABLE_KEY = 'public-test-key';
    (global.fetch as jest.Mock).mockRejectedValue(new Error('private provider detail'));

    await expect(subject.getReadiness()).resolves.toMatchObject({
      status: 'degraded',
      checks: { api: 'ok', database: 'unreachable' },
    });
  });
});
