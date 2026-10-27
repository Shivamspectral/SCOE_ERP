import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({ controllers: [AcademicController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class AcademicModule {}
