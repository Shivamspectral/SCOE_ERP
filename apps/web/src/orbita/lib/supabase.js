/**
 * Minimal Supabase Auth client (dependency-free).
 *
 * Scope of this module (README §9, §29):
 *  - Authentication only: sign in, sign out, session refresh, password recovery.
 *  - It holds the PUBLIC anon key, never a service-role key.
 *  - It does not read or write application tables. All institutional data goes
 *    through the Next.js backend, which performs authorization.
 *
 * Carried over from the Supabase-wired build; the direct PostgREST table access
 * that build used was intentionally dropped, because it would put authorization
 * decisions on the client.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. Authentication is disabled."
  );
}

const SESSION_KEY = "smart_campus_session";

let session = null;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(session);
    } catch (e) {
      console.error("[supabase] auth listener failed", e);
    }
  });
}

function persist(next) {
  session = next;
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable (private mode / WebView) */
  }
  emit();
}

function restore() {
  if (session) return session;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    session = null;
  }
  return session;
}

function headers(token) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

async function request(path, options = {}, token) {
  if (!isSupabaseConfigured) {
    throw new Error("Authentication is not configured for this deployment.");
  }

  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...headers(token), ...(options.headers || {}) },
  });

  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const message =
      body?.msg ||
      body?.message ||
      body?.error_description ||
      body?.error ||
      `Authentication request failed (${res.status})`;
    throw new Error(message);
  }

  return body;
}

export async function supabaseResetPassword(email) {
  return request("/auth/v1/recover", { method: "POST", body: JSON.stringify({ email }) });
}

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }) {
      const data = await request("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persist(data);
      return { data, error: null };
    },

    async signUp({ email, password, options = {} }) {
      const data = await request("/auth/v1/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, data: { ...(options.data || {}) } }),
      });
      const sessionData = data?.session || (data?.access_token ? data : null);
      if (sessionData?.access_token) persist(sessionData);
      return { data: { ...data, session: sessionData }, error: null };
    },

    async signOut() {
      const token = restore()?.access_token;
      if (token) {
        await request("/auth/v1/logout", { method: "POST" }, token).catch(() => {});
      }
      persist(null);
      return { error: null };
    },

    async getSession() {
      const current = restore();
      const expiresAt = Number(current?.expires_at || 0);
      if (current?.refresh_token && expiresAt && expiresAt * 1000 <= Date.now() + 60_000) {
        try {
          return await this.refreshSession();
        } catch (error) {
          persist(null);
          return { data: { session: null }, error };
        }
      }
      return { data: { session: current }, error: null };
    },

    getUser() {
      const token = restore()?.access_token;
      if (!token) return Promise.resolve({ data: { user: null }, error: null });
      return request("/auth/v1/user", { method: "GET" }, token)
        .then((user) => ({ data: { user }, error: null }))
        .catch((error) => ({ data: { user: null }, error }));
    },

    onAuthStateChange(callback) {
      listeners.add(callback);
      return {
        data: { subscription: { unsubscribe: () => listeners.delete(callback) } },
      };
    },

    async refreshSession() {
      const refreshToken = restore()?.refresh_token;
      if (!refreshToken) return { data: { session: null }, error: null };
      const data = await request("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      persist(data);
      return { data: { session: data }, error: null };
    },
  },
};
