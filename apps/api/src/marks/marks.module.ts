import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { MarksController } from './marks.controller';

@Module({ controllers: [MarksController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class MarksModule {}
