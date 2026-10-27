import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { TasksController } from './tasks.controller';

@Module({
  controllers: [TasksController],
  providers: [SupabaseAuthGuard, SupabaseRequestClient],
})
export class TasksModule {}
