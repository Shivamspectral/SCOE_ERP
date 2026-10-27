import { Module } from '@nestjs/common';
import { CircularsController } from './circulars.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({ controllers: [CircularsController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class CircularsModule {}
