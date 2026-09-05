import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useSiteContent } from "@/lib/site-content";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/** وضع الصيانة: يخفي الموقع عن الزوار ويبقيه للإدارة وصفحات الدخول */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const sc = useSiteContent();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [staff, setStaff] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStaff(false);
      return;
    }
    const sb = getSupabase();
    const check = async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) {
        setStaff(false);
        return;
      }
      const { data } = await sb
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      setStaff(["owner", "admin", "moderator"].includes(data?.role ?? ""));
    };
    void check();
    const { data: sub } = sb.auth.onAuthStateChange(() => void check());
    return () => sub.subscription.unsubscribe();
  }, []);

  const on = sc["maintenance_mode"] === "true";
  const bypass = path.startsWith("/admin") || path.startsWith("/portal") || staff;
  if (!on || bypass || staff === null) return <>{children}</>;

  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center"
      dir="rtl"
    >
      <div className="eyebrow-pill">صيانة</div>
      <h1 className="mt-6 font-arabic text-4xl text-navy">
        {sc["site_name_ar"] || "آل بوخف الناهسي"}
      </h1>
      <p className="mt-4 max-w-md text-navy/60">
        {sc["maintenance_message"] || "الموقع تحت الصيانة — نعود قريباً"}
      </p>
      <a href="/portal" className="btn-outline-navy mt-8">
        دخول الإدارة
      </a>
    </div>
  );
}
