import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
@Module({ controllers: [FinanceController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class FinanceModule {}
