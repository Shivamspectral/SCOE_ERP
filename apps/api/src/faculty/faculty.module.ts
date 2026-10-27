import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { FacultyController } from './faculty.controller';

@Module({
  controllers: [FacultyController],
  providers: [SupabaseAuthGuard, SupabaseRequestClient],
})
export class FacultyModule {}
