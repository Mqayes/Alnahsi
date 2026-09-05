import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Stats = {
  members: number;
  users: number;
  pending: number;
  approved: number;
  news: number;
  suspended: number;
  messages: number;
};
type Req = { id: string; full_name_en: string; email: string; created_at: string; status: string };
type Msg = {
  id: string;
  created_at: string;
  kind: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string;
  status: string;
};

export function Dashboard({
  go,
  isOwner = false,
}: {
  go: (tab: string) => void;
  isOwner?: boolean;
}) {
  const [s, setS] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Req[]>([]);
  const [inbox, setInbox] = useState<Msg[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      try {
        const [m, u, p, ap, n, sm, su, r] = await Promise.all([
          sb.from("family_members").select("id", { count: "exact", head: true }),
          sb.from("profiles").select("id", { count: "exact", head: true }),
          sb
            .from("join_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          sb
            .from("join_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "approved"),
          sb.from("news_posts").select("id", { count: "exact", head: true }),
          sb
            .from("support_messages")
            .select("id", { count: "exact", head: true })
            .eq("status", "new")
            .then(
              (r) => r,
              () => ({ count: 0 }),
            ),
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
          approved: ap.count ?? 0,
          news: n.count ?? 0,
          suspended: su.count ?? 0,
          messages: (sm as { count?: number | null }).count ?? 0,
        });
        setRecent((r.data ?? []) as Req[]);
        try {
          const { data: msgs } = await sb
            .from("support_messages")
            .select("id, created_at, kind, name, email, phone, message, status")
            .eq("status", "new")
            .order("created_at", { ascending: false })
            .limit(6);
          setInbox((msgs ?? []) as Msg[]);
        } catch {
          /* pre-migration */
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "خطأ");
      }
    })();
  }, []);

  const markHandled = async (id: string) => {
    const {
      data: { session },
    } = await getSupabase().auth.getSession();
    await getSupabase()
      .from("support_messages")
      .update({
        status: "handled",
        handled_by: session?.user.id,
        handled_at: new Date().toISOString(),
      })
      .eq("id", id);
    setInbox((l) => l.filter((m) => m.id !== id));
  };
  const wa = (p: string | null) => {
    const x = (p ?? "").replace(/\D/g, "");
    return x ? `https://wa.me/${x.startsWith("0") ? "966" + x.slice(1) : x}` : "";
  };

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
      className="premium-card p-4 text-right transition hover:-translate-y-0.5 md:p-5"
    >
      <div
        className={`hero-kufi text-3xl ${tone === "red" ? "text-red-600" : tone === "emerald" ? "text-[#1F5C4F]" : tone === "navy" ? "text-navy" : "text-gold"}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs leading-snug text-navy/60 md:text-sm">{label}</div>
    </button>
  );

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h2 className="font-arabic text-2xl text-navy">لوحة القيادة</h2>
        <p className="text-sm text-navy/60">نظرة عامة على العائلة والمنصة</p>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <Card label="أفراد في الشجرة" value={s?.members ?? "…"} tab="members" />
        <Card
          label="طلبات معتمدة (أُضيفت للشجرة)"
          value={s?.approved ?? "…"}
          tab="requests"
          tone="emerald"
        />
        <Card
          label="حسابات دخول فعّالة (سجّلوا الدخول)"
          value={s?.users ?? "…"}
          tab="users"
          tone="navy"
        />
        <Card
          label="طلبات بانتظار الاعتماد"
          value={s?.pending ?? "…"}
          tab="requests"
          tone={s?.pending ? "red" : "navy"}
        />
        <Card
          label="رسائل جديدة"
          value={s?.messages ?? "…"}
          tab="messages"
          tone={s?.messages ? "red" : "navy"}
        />
        <Card label="أخبار منشورة" value={s?.news ?? "…"} tab="news" tone="navy" />
        <Card label="حسابات موقوفة" value={s?.suspended ?? "…"} tab="users" tone="navy" />
      </div>

      <div className="premium-card border-amber-300/60 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-arabic text-lg text-navy">
            📥 صندوق الرسائل{" "}
            {inbox.length > 0 && (
              <span className="ms-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                {inbox.length}
              </span>
            )}
          </h3>
          <button onClick={() => go("messages")} className="text-sm text-gold hover:underline">
            فتح صندوق الرسائل
          </button>
        </div>
        {inbox.length === 0 ? (
          <p className="mt-3 text-sm text-navy/50">لا توجد رسائل جديدة</p>
        ) : (
          <ul className="mt-3 divide-y divide-gold/15">
            {inbox.map((m) => (
              <li key={m.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 ${m.kind === "activation" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"}`}
                  >
                    {m.kind === "activation" ? "تفعيل حساب" : "استفسار"}
                  </span>
                  <span className="font-arabic text-sm text-navy">{m.name || "—"}</span>
                  <span className="text-navy/40" dir="ltr">
                    {new Date(m.created_at).toLocaleString("ar-SA")}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-navy/75">{m.message}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.email && (
                    <a
                      href={`mailto:${m.email}`}
                      className="rounded-md border border-gold/40 px-2.5 py-1 text-xs text-navy hover:bg-parchment"
                    >
                      رد بالبريد
                    </a>
                  )}
                  {wa(m.phone) && (
                    <a
                      href={wa(m.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-gold/40 px-2.5 py-1 text-xs text-navy hover:bg-parchment"
                    >
                      رد بواتساب
                    </a>
                  )}
                  <button
                    onClick={() => void markHandled(m.id)}
                    className="rounded-md bg-gold px-2.5 py-1 text-xs font-semibold text-navy"
                  >
                    ✓ تمت المعالجة
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
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
              ["events", "🎉 تسجيل مناسبة (مولود/زواج/وفاة)"],
              ["news", "＋ نشر خبر"],
              ["gallery", "＋ رفع صور"],
              ["users", "إدارة الحسابات"],
              ["content", "✎ تعديل محتوى الصفحات"],
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
