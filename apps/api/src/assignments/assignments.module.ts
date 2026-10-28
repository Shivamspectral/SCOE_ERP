import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({ controllers: [AssignmentsController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class AssignmentsModule {}
