import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { DbUpgrade } from "@/components/admin/DbUpgrade";

type Stats = { members: number; users: number; pending: number; news: number; suspended: number };
type Req = { id: string; full_name_en: string; email: string; created_at: string; status: string };

export function Dashboard({ go }: { go: (tab: string) => void }) {
  const [s, setS] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Req[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      try {
        const [m, u, p, n, su, r] = await Promise.all([
          sb.from("family_members").select("id", { count: "exact", head: true }),
          sb.from("profiles").select("id", { count: "exact", head: true }),
          sb
            .from("join_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          sb.from("news_posts").select("id", { count: "exact", head: true }),
          sb
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("status", "suspended"),
          sb
            .from("join_requests")
            .select("id, full_name_en, email, created_at, status")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);
        setS({
          members: m.count ?? 0,
          users: u.count ?? 0,
          pending: p.count ?? 0,
          news: n.count ?? 0,
          suspended: su.count ?? 0,
        });
        setRecent((r.data ?? []) as Req[]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "خطأ");
      }
    })();
  }, []);

  const Card = ({
    label,
    value,
    tab,
    tone = "gold",
  }: {
    label: string;
    value: number | string;
    tab: string;
    tone?: "gold" | "emerald" | "navy" | "red";
  }) => (
    <button
      onClick={() => go(tab)}
      className="premium-card p-5 text-right transition hover:-translate-y-0.5"
    >
      <div
        className={`hero-kufi text-3xl ${tone === "red" ? "text-red-600" : tone === "emerald" ? "text-[#1F5C4F]" : tone === "navy" ? "text-navy" : "text-gold"}`}
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-navy/60">{label}</div>
    </button>
  );

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h2 className="font-arabic text-2xl text-navy">لوحة القيادة</h2>
        <p className="text-sm text-navy/60">نظرة عامة على العائلة والمنصة</p>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <DbUpgrade />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card label="أفراد في الشجرة" value={s?.members ?? "…"} tab="members" />
        <Card label="حسابات مسجّلة" value={s?.users ?? "…"} tab="users" tone="emerald" />
        <Card
          label="طلبات بانتظار الاعتماد"
          value={s?.pending ?? "…"}
          tab="requests"
          tone={s?.pending ? "red" : "navy"}
        />
        <Card label="أخبار منشورة" value={s?.news ?? "…"} tab="news" tone="navy" />
        <Card label="حسابات موقوفة" value={s?.suspended ?? "…"} tab="users" tone="navy" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="premium-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-arabic text-lg text-navy">آخر طلبات الانضمام</h3>
            <button onClick={() => go("requests")} className="text-sm text-gold hover:underline">
              عرض الكل
            </button>
          </div>
          <ul className="mt-3 divide-y divide-gold/15">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="text-navy">{r.full_name_en}</div>
                  <div className="text-xs text-navy/40" dir="ltr">
                    {r.email}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${r.status === "pending" ? "bg-amber-100 text-amber-800" : r.status === "approved" ? "bg-green-100 text-green-700" : "bg-navy/10 text-navy"}`}
                >
                  {r.status === "pending" ? "بانتظار" : r.status === "approved" ? "معتمد" : "مرفوض"}
                </span>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="py-4 text-center text-sm text-navy/50">لا توجد طلبات</li>
            )}
          </ul>
        </div>

        <div className="premium-card p-5">
          <h3 className="font-arabic text-lg text-navy">إجراءات سريعة</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["members", "＋ إضافة فرد للشجرة"],
              ["news", "＋ نشر خبر"],
              ["gallery", "＋ رفع صور"],
              ["users", "إدارة الحسابات"],
              ["content", "تعديل محتوى الموقع"],
              ["settings", "إعدادات المنصة"],
            ].map(([t, l]) => (
              <button
                key={t}
                onClick={() => go(t)}
                className="rounded-lg border border-gold/30 bg-parchment px-3 py-2 text-sm text-navy hover:bg-gold hover:text-white"
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
