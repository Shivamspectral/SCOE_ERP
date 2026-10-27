import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({ controllers: [DashboardController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class DashboardModule {}
