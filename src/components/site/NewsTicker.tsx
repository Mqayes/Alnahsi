import { Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { useSiteContent } from "@/lib/site-content";
import { fetchNews } from "@/lib/news";
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
  const [reduceMotion, setReduceMotion] = useState(false);

  const enabled = sc["ticker_enabled"] !== "false";

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void fetchNews().then((res) => {
      if (!cancelled) setItems(res.items.slice(0, 8));
    });
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

  if (!enabled || items.length === 0) return null;

  const ar = lang === "ar";
  const label = ar ? "أخبار العائلة" : "Family news";
  const titleOf = (n: NewsItem) => (ar ? n.title_ar || n.title_en : n.title_en || n.title_ar);

  // نحو ٣٫٢ ثانية لكل خبر: سريع بما يكفي ليبدو حياً، بطيء بما يكفي ليُقرأ.
  const duration = Math.max(12, items.length * 3.2);

  const strip = (
    <>
      {items.map((n) => (
        <Link
          key={n.id}
          to="/news"
          className="mx-6 inline-flex shrink-0 items-center gap-2 text-[13px] text-cream/90 transition-colors hover:text-gold"
        >
          <span aria-hidden="true" className="text-gold">
            ◆
          </span>
          <span className="whitespace-nowrap">{titleOf(n)}</span>
        </Link>
      ))}
    </>
  );

  return (
    <div className="border-b border-gold/20 bg-navy" role="region" aria-label={label}>
      <div className="mx-auto flex max-w-7xl items-stretch">
        <span className="z-10 flex shrink-0 items-center gap-2 bg-gold px-3 py-1.5 text-[11px] font-bold text-navy md:px-4">
          <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-navy/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-navy" />
          </span>
          {label}
        </span>

        {reduceMotion ? (
          <div className="flex min-w-0 flex-1 items-center overflow-x-auto py-1.5">{strip}</div>
        ) : (
          <div className="ticker-viewport group min-w-0 flex-1 py-1.5">
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
