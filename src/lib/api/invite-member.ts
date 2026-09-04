import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const inviteFamilyMember = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    email: z.string().email(),
    fullName: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const supabase = getAdminSupabase();
    if (!supabase) return { success: true, skipped: true };
    const siteUrl = process.env.VITE_SITE_URL ?? "https://alnahsi-family-portal.vercel.app";
    const { error } = await supabase.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: data.fullName ?? "" },
      redirectTo: `${siteUrl}/portal`,
    });

    if (!error) return { success: true };

    // User already exists (old invite or previously removed) — delete and re-invite
    if (error.message.toLowerCase().includes("already")) {
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existing = listData?.users?.find((u) => u.email === data.email);
      if (existing) {
        await supabase.auth.admin.deleteUser(existing.id);
      }
      const { error: retryError } = await supabase.auth.admin.inviteUserByEmail(data.email, {
        data: { full_name: data.fullName ?? "" },
        redirectTo: `${siteUrl}/portal`,
      });
      if (retryError) return { success: false, error: retryError.message };
      return { success: true };
    }

    return { success: false, error: error.message };
  });
