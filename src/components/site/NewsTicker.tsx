import { Link } from "@tanstack/react-router";
import { fetchTreeRows } from "@/lib/tree-source";
import { useEffect, useState, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { useSiteContent } from "@/lib/site-content";
import { fetchNews } from "@/lib/news";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { NewsItem } from "@/lib/news-data";

/**
 * شريط أخبار دوّار في أعلى الموقع.
 * - يعكس اتجاه الحركة تلقائياً بين العربية والإنجليزية.
 * - يتوقف عند المرور بالمؤشر وعند تركيز لوحة المفاتيح.
 * - يحترم إعداد النظام "تقليل الحركة" فيعرض القائمة ساكنة بدل التمرير.
 */
export function NewsTicker() {
  const { lang } = useLang();
  const sc = useSiteContent();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<{ id: string; text: string; icon: string }[]>([]);

  const [reduceMotion, setReduceMotion] = useState(false);
  const [loaded, setLoaded] = useState({ news: false, events: false });

  // عرض فوري من ذاكرة الجلسة، ثم تحديث من الخادم
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("alnahsi_ticker");
      if (raw) {
        const c = JSON.parse(raw) as {
          items: NewsItem[];
          events: { id: string; text: string; icon: string }[];
        };
        if (c.items?.length || c.events?.length) {
          setItems(c.items ?? []);
          setEvents(c.events ?? []);
          setLoaded({ news: true, events: true });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const enabled = sc["ticker_enabled"] !== "false";

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void fetchNews()
      .then((res) => {
        if (!cancelled) setItems(res.items.slice(0, 5));
      })
      .finally(() => {
        if (!cancelled) setLoaded((l) => ({ ...l, news: true }));
      });
    if (!isSupabaseConfigured()) setLoaded((l) => ({ ...l, events: true }));
    if (isSupabaseConfigured()) {
      const y = new Date().getFullYear();
      void fetchTreeRows(
        "id, full_name_ar, full_name_en, birth_year, death_year, marriage_year, is_deceased, gender",
      ).then(({ rows: data }) => {
        if (cancelled || !data) return;
        type R = {
          id: string;
          full_name_ar: string | null;
          full_name_en: string | null;
          birth_year: number | null;
          death_year: number | null;
          marriage_year: number | null;
          is_deceased: boolean | null;
          gender: string | null;
        };
        const out: { id: string; text: string; icon: string; w: number }[] = [];
        (data as R[]).forEach((r) => {
          const nm = r.full_name_ar || r.full_name_en;
          if (!nm) return;
          const first = nm.split(/\s+/).slice(0, 3).join(" ");
          if (r.birth_year && y - r.birth_year <= 1 && !r.is_deceased)
            out.push({
              id: r.id + "b",
              icon: "🍼",
              w: y - r.birth_year,
              text: `مبارك المولود ${first}`,
            });
          if (r.marriage_year && y - r.marriage_year <= 1)
            out.push({
              id: r.id + "m",
              icon: "💍",
              w: y - r.marriage_year,
              text: `مبارك زواج ${first}`,
            });
          if (r.death_year && y - r.death_year <= 1)
            out.push({
              id: r.id + "d",
              icon: "🕊",
              w: y - r.death_year,
              text: `${first} — رحمه الله`,
            });
        });
        setEvents(out.sort((a, b) => a.w - b.w).slice(0, 6));
        setLoaded((l) => ({ ...l, events: true }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!loaded.news || !loaded.events) return;
    try {
      sessionStorage.setItem("alnahsi_ticker", JSON.stringify({ items, events }));
    } catch {
      /* ignore */
    }
  }, [loaded, items, events]);

  const settled = loaded.news && loaded.events;
  const empty = items.length === 0 && events.length === 0;
  if (!enabled) return null;
  if (settled && empty) return null;

  const ar = lang === "ar";
  const label = ar ? "أخبار ومناسبات" : "News & events";
  const titleOf = (n: NewsItem) => (ar ? n.title_ar || n.title_en : n.title_en || n.title_ar);

  // نحو ٣٫٢ ثانية لكل خبر: سريع بما يكفي ليبدو حياً، بطيء بما يكفي ليُقرأ.
  const duration = Math.max(14, (items.length + events.length) * 3.4);

  const shorten = (s: string, max = 60) =>
    s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;

  const strip = (
    <>
      {events.map((e) => (
        <Link
          key={e.id}
          to="/news"
          className="mx-7 inline-flex shrink-0 items-center gap-2 text-[15px] font-semibold text-[#F0CC60] transition-colors hover:text-white md:text-base"
        >
          <span aria-hidden="true">{e.icon}</span>
          <span className="whitespace-nowrap">{e.text}</span>
        </Link>
      ))}
      {items.map((n) => (
        <Link
          key={n.id}
          to="/news"
          className="mx-7 inline-flex shrink-0 items-center gap-2 text-[15px] text-cream/95 transition-colors hover:text-gold md:text-base"
        >
          <span aria-hidden="true" className="text-gold">
            ◆
          </span>
          <span className="whitespace-nowrap">{shorten(titleOf(n))}</span>
        </Link>
      ))}
    </>
  );

  return (
    <div className="border-b border-gold/20 bg-navy" role="region" aria-label={label}>
      <div className="mx-auto flex max-w-7xl items-stretch">
        <span className="z-10 flex shrink-0 items-center gap-2 bg-gold px-4 py-2.5 text-[13px] font-bold text-navy md:px-5 md:text-sm">
          <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-navy/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-navy" />
          </span>
          {label}
        </span>

        {!settled && empty ? (
          <div className="flex min-w-0 flex-1 items-center gap-6 overflow-hidden py-2.5 ps-6">
            {[64, 40, 52].map((w, i) => (
              <span
                key={i}
                className="h-3 animate-pulse rounded bg-cream/20"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
        ) : reduceMotion ? (
          <div className="flex min-w-0 flex-1 items-center overflow-x-auto py-2.5">{strip}</div>
        ) : (
          <div className="ticker-viewport group min-w-0 flex-1 py-2.5">
            <div
              className={`ticker-track ${ar ? "ticker-rtl" : "ticker-ltr"}`}
              style={{ "--ticker-duration": `${duration}s` } as CSSProperties}
            >
              {strip}
              {/* نسخة ثانية تجعل الدوران متصلاً بلا قفزة */}
              <span aria-hidden="true">{strip}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
