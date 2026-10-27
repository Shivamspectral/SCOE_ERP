import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({
  controllers: [DepartmentsController],
  providers: [SupabaseAuthGuard, SupabaseRequestClient],
})
export class DepartmentsModule {}
