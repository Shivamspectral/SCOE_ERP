import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
import { DocumentsController } from './documents.controller';

@Module({ controllers: [DocumentsController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class DocumentsModule {}
