import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { renderBody } from "@/lib/sanitize-html";
import { fetchOccasions, kindLabel, type Occasion } from "@/lib/occasions";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/occasions")({
  head: () => ({
    meta: [
      { title: "مناسبات العائلة — بيت آل بوخف الناهسي" },
      { name: "description", content: "لقاءات العائلة ومناسباتها وإعلاناتها." },
    ],
  }),
  component: OccasionsPage,
});

function when(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "full", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

function OccasionsPage() {
  const [items, setItems] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isSupabaseConfigured()) {
        const {
          data: { session },
        } = await getSupabase().auth.getSession();
        if (!cancelled) setSignedIn(Boolean(session));
      }
      const res = await fetchOccasions();
      if (cancelled) return;
      setItems(res.items);
      setNeedsMigration(res.needsMigration);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const now = Date.now();
  const upcoming = items.filter((o) => o.starts_at && new Date(o.starts_at).getTime() >= now);
  const rest = items.filter((o) => !upcoming.includes(o));

  const card = (o: Occasion, i: number) => {
    const k = kindLabel(o.kind);
    return (
      <Reveal key={o.id} delay={i * 60}>
        <article className="premium-card h-full overflow-hidden">
          {o.cover_image && (
            <img src={o.cover_image} alt="" loading="lazy" className="h-44 w-full object-cover" />
          )}
          <div className="p-5">
            <span className="eyebrow-pill">
              {k.icon} {k.label}
            </span>
            <h2 className="mt-3 font-arabic text-xl leading-snug text-navy">{o.title}</h2>
            {o.starts_at && <p className="mt-2 text-sm text-navy/70">🗓 {when(o.starts_at)}</p>}
            {o.location && <p className="text-sm text-navy/70">📍 {o.location}</p>}
            {o.body && (
              <div
                className="prose-blog mt-3 text-sm text-navy/75"
                dangerouslySetInnerHTML={{ __html: renderBody(o.body) }}
              />
            )}
            <p className="mt-4 border-t border-gold/20 pt-3 text-xs text-navy/50">
              {o.author_name || "أحد أفراد العائلة"}
            </p>
          </div>
        </article>
      </Reveal>
    );
  };

  return (
    <section dir="rtl" className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <header className="text-center">
        <span className="eyebrow-pill">ما يجمعنا</span>
        <h1 className="mt-3 font-arabic text-4xl text-navy md:text-5xl">مناسبات العائلة</h1>
        <p className="mx-auto mt-4 max-w-2xl text-navy/70">
          لقاءاتنا وأفراحنا وإعلاناتنا — ينشرها أفراد العائلة بأنفسهم.
        </p>
        {signedIn && (
          <Link to="/my-blog" className="btn-gold mt-8 inline-flex">
            ✎ أضف مناسبة
          </Link>
        )}
      </header>

      {loading && (
        <p className="mt-14 text-center font-serif-display text-navy/60">جارٍ التحميل…</p>
      )}

      {!loading && needsMigration && (
        <div className="premium-card mx-auto mt-14 max-w-xl p-6 text-center">
          <p className="font-arabic text-lg text-navy">المناسبات غير مفعّلة بعد</p>
          <p className="mt-2 text-sm text-navy/70">
            على المالك تطبيق ترقية «مناسبات وإعلانات الأعضاء» من لوحة التحكم.
          </p>
        </div>
      )}

      {!loading && !needsMigration && items.length === 0 && (
        <div className="premium-card mx-auto mt-14 max-w-xl p-8 text-center">
          <p className="font-arabic text-lg text-navy">لا مناسبات منشورة بعد</p>
          <p className="mt-2 text-sm text-navy/70">
            {signedIn ? "كن أول من ينشر." : "سجّل دخولك لترى ما تنشره العائلة."}
          </p>
          {!signedIn && (
            <Link to="/portal" className="btn-gold mt-6 inline-flex">
              تسجيل الدخول
            </Link>
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 className="mt-14 font-arabic text-2xl text-navy">القادمة</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{upcoming.map(card)}</div>
        </>
      )}

      {rest.length > 0 && (
        <>
          {upcoming.length > 0 && (
            <h2 className="mt-16 font-arabic text-2xl text-navy">مناسبات وإعلانات</h2>
          )}
          <div
            className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${upcoming.length ? "mt-6" : "mt-14"}`}
          >
            {rest.map(card)}
          </div>
        </>
      )}
    </section>
  );
}
