import { Module } from '@nestjs/common';
import { MentoringController } from './mentoring.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({ controllers: [MentoringController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class MentoringModule {}
