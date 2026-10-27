import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SupabaseRequestClient } from '../database/supabase-request-client.service';

@Module({ controllers: [NotificationsController], providers: [SupabaseAuthGuard, SupabaseRequestClient] })
export class NotificationsModule {}
