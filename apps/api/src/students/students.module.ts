import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({ controllers: [StudentsController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class StudentsModule {}
