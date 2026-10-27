import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & { authUser?: { id: string; email?: string }; accessToken?: string };

/**
 * Verifies the bearer token with Supabase. This proves identity only; role,
 * institution, department and record-level access must be resolved separately
 * from trusted application records. Never trust role claims from the browser.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new UnauthorizedException('Authentication required');

    const client = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
    );
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid or expired session');
    request.authUser = { id: data.user.id, email: data.user.email };
    request.accessToken = token;
    return true;
  }
}
