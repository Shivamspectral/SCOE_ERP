import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({ controllers: [ReportsController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class ReportsModule {}
