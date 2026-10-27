import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({ controllers: [UsersController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class UsersModule {}
