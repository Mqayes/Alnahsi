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

export const resetMemberPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    email: z.string().email(),
    newPassword: z.string().min(6),
  }))
  .handler(async ({ data }) => {
    const supabase = getAdminSupabase();
    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const user = listData?.users?.find((u) => u.email === data.email);
    if (!user) return { success: false, error: "User not found." };
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: data.newPassword,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  });
