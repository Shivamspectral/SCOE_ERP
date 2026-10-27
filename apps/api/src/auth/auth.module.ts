import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({
  controllers: [AuthController],
  providers: [SupabaseAuthGuard, SupabaseRequestClient],
  exports: [SupabaseAuthGuard, SupabaseRequestClient],
})
export class AuthModule {}
