import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({ controllers: [OperationsController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class OperationsModule {}
