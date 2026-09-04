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

export const removeFamilyMember = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      memberId: z.string(),
      email: z.string().email().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getAdminSupabase();

    const { error: deleteError } = await supabase
      .from("family_members")
      .delete()
      .eq("id", data.memberId);

    if (deleteError) return { success: false, error: deleteError.message };

    if (data.email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      if (profile?.id) {
        await supabase.auth.admin.deleteUser(profile.id);
      }
    }

    return { success: true };
  });
