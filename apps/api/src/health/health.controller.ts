import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return { status: 'ok', service: 'astra-campus-api', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  getReadiness() {
    return { status: 'degraded', checks: { api: 'ok', database: 'not-configured' } };
  }
}
