import { getSupabase } from "@/lib/supabase";

/** يرسل رابط دخول سحري للعضو — ينشئ حسابه عند أول دخول، بلا مفاتيح خادم */
export async function inviteByMagicLink(email: string, fullName?: string) {
  const { error } = await getSupabase().auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/portal`,
      data: fullName ? { full_name: fullName } : undefined,
    },
  });
  return error ? { success: false as const, error: error.message } : { success: true as const };
}
