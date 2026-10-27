import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { AuditController } from './audit.controller';

@Module({ controllers: [AuditController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class AuditModule {}
