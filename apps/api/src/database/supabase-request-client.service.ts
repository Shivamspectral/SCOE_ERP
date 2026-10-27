import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthenticatedRequest } from '../auth/supabase-auth.guard';

/** Forward the verified caller JWT so PostgreSQL RLS and auth.uid() remain active. */
@Injectable()
export class SupabaseRequestClient {
  constructor(private readonly config: ConfigService) {}

  forRequest(request: AuthenticatedRequest): SupabaseClient {
    const token = request.accessToken;
    if (!token) throw new Error('Authenticated request has no bearer token');
    return createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY'),
      {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );
  }
}
