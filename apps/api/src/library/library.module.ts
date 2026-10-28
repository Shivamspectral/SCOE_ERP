import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';
@Module({ controllers: [LibraryController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class LibraryModule {}
