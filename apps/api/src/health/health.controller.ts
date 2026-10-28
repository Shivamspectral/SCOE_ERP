import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'astra-campus-api',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * A real readiness probe: liveness remains cheap, while readiness checks that
   * the configured Supabase Auth endpoint is reachable. Never expose credentials
   * or raw provider errors in this public response.
   */
  @Get('ready')
  async getReadiness() {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_PUBLISHABLE_KEY');

    if (!url || !key) {
      return {
        status: 'degraded',
        checks: { api: 'ok', database: 'not-configured' },
      };
    }

    try {
      const response = await fetch(`${url.replace(/\/+$/, '')}/auth/v1/health`, {
        method: 'GET',
        headers: { apikey: key },
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        return {
          status: 'degraded',
          checks: { api: 'ok', database: 'unreachable' },
        };
      }

      return {
        status: 'ok',
        checks: { api: 'ok', database: 'reachable' },
      };
    } catch {
      return {
        status: 'degraded',
        checks: { api: 'ok', database: 'unreachable' },
      };
    }
  }
}
