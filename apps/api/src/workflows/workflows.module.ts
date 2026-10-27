import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({
  controllers: [WorkflowsController],
  providers: [SupabaseAuthGuard, SupabaseRequestClient],
})
export class WorkflowsModule {}
