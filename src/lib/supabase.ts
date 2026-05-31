import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function getSupabase(): SupabaseClient {
  if (supabaseClient) return supabaseClient;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars.");
  }
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return supabaseClient;
}

// This is the named export portal.tsx uses
export const supabase = getSupabase();

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
