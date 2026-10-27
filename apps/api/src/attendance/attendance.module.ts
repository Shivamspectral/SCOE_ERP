import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({ controllers: [AttendanceController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class AttendanceModule {}
