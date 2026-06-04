import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY on server");
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
    const siteUrl = process.env.VITE_SITE_URL ?? "https://alnahsi-family-portal.vercel.app";
    const { error } = await supabase.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: data.fullName ?? "" },
      redirectTo: `${siteUrl}/family`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  });
