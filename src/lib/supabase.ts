import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      url !== "https://your-project.supabase.co" &&
      key !== "your-anon-key",
  );
}

export function getSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart the dev server.",
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });

  return supabaseClient;
}

/** Prevent UI hanging forever when Supabase is slow or unreachable */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms = 12_000,
  label = "Supabase request",
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms,
    );
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export type Profile = {
  id: string;
  role: string;
  email?: string | null;
  full_name?: string | null;
};

export type JoinRequest = {
  id: string;
  full_name: string;
  email: string;
  message?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type NewsPost = {
  id: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  full_name: string;
  email?: string | null;
  relationship?: string | null;
  created_at: string;
};
