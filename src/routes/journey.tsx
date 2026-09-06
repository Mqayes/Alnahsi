import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Ornament } from "@/components/site/Ornament";
import type { PersonRow } from "@/components/tree/PersonCard";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "رحلة العائلة عبر الزمن — آل بوخف الناهسي" },
      {
        name: "description",
        content:
          "من الحفائر وبلاد ناهس إلى تندحه والقصيم وتبوك ثم الرياض — خريطة انتشار عائلة آل بوخف الناهسي عبر الأجيال.",
      },
    ],
  }),
  component: JourneyPage,
});

/** إحداثيات تقريبية داخل صورة الخريطة (نسبة مئوية) */
const PLACES: Record<string, { x: number; y: number; ar: string }> = {
  الحفائر: { x: 42, y: 76, ar: "الحفائر" },
  "بلاد ناهس": { x: 40, y: 74, ar: "بلاد ناهس القاعة" },
  تندحه: { x: 44, y: 72, ar: "تندحه" },
  أبها: { x: 38, y: 78, ar: "أبها" },
  "خميس مشيط": { x: 41, y: 77, ar: "خميس مشيط" },
  نجران: { x: 52, y: 84, ar: "نجران" },
  جازان: { x: 33, y: 84, ar: "جازان" },
  الرياض: { x: 60, y: 46, ar: "الرياض" },
  القصيم: { x: 51, y: 36, ar: "القصيم" },
  بريدة: { x: 50, y: 35, ar: "بريدة" },
  تبوك: { x: 26, y: 20, ar: "تبوك" },
  جدة: { x: 30, y: 56, ar: "جدة" },
  مكة: { x: 33, y: 57, ar: "مكة المكرمة" },
  المدينة: { x: 30, y: 42, ar: "المدينة المنورة" },
  الدمام: { x: 74, y: 38, ar: "الدمام" },
  الطائف: { x: 36, y: 55, ar: "الطائف" },
  حائل: { x: 43, y: 27, ar: "حائل" },
};

const ERAS = [
  { from: 0, to: 1899, ar: "ما قبل ١٩٠٠ — الحفائر وبلاد ناهس", en: "Before 1900" },
  { from: 1900, to: 1949, ar: "١٩٠٠–١٩٤٩ — تندحه والزراعة", en: "1900–1949" },
  { from: 1950, to: 1979, ar: "١٩٥٠–١٩٧٩ — القصيم وتبوك", en: "1950–1979" },
  { from: 1980, to: 1999, ar: "١٩٨٠–١٩٩٩ — الاستقرار في الرياض", en: "1980–1999" },
  { from: 2000, to: 2100, ar: "٢٠٠٠ حتى اليوم — الانتشار", en: "2000–today" },
];

function matchPlace(city?: string | null) {
  if (!city) return null;
  const key = Object.keys(PLACES).find((k) => city.includes(k));
  return key ? { key, ...PLACES[key] } : null;
}

function JourneyPage() {
  const { lang } = useLang();
  const ar = lang !== "en";
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [era, setEra] = useState(ERAS.length - 1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    getSupabase()
      .from("tree_public")
      .select("*")
      .then(({ data }) => setRows((data ?? []) as PersonRow[]));
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setEra((e) => (e + 1) % ERAS.length), 1800);
    return () => clearInterval(t);
  }, [playing]);

  const upTo = ERAS[era].to;
  const counts = useMemo(() => {
    const map: Record<string, { n: number; ar: string; x: number; y: number }> = {};
    rows.forEach((r) => {
      const p = matchPlace(r.city);
      if (!p) return;
      if (r.birth_year && r.birth_year > upTo) return;
      map[p.key] = map[p.key] ?? { n: 0, ar: p.ar, x: p.x, y: p.y };
      map[p.key].n += 1;
    });
    return map;
  }, [rows, upTo]);

  const total = Object.values(counts).reduce((s, c) => s + c.n, 0);
  const max = Math.max(1, ...Object.values(counts).map((c) => c.n));
  const unknown = rows.filter(
    (r) => !matchPlace(r.city) && (!r.birth_year || r.birth_year <= upTo),
  ).length;

  return (
    <main dir={ar ? "rtl" : "ltr"} className="min-h-screen bg-parchment px-4 pb-20 pt-28">
      <div className="mx-auto max-w-4xl text-center">
        <span className="eyebrow-pill">{ar ? "رحلة العائلة" : "The journey"}</span>
        <h1 className="mt-4 font-arabic text-4xl text-navy md:text-5xl">
          {ar ? "من الحفائر إلى الرياض" : "From Al-Hafayer to Riyadh"}
        </h1>
        <Ornament className="mt-4" />
        <p className="mt-4 text-navy/65">
          {ar
            ? "شاهد انتشار العائلة عبر الأجيال — حرّك المؤشر أو شغّل العرض."
            : "Watch the family spread across generations."}
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-4xl">
        <div className="premium-card overflow-hidden p-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#F5EDD8] to-[#EDE0C4]">
            {/* شبه الجزيرة — رسم مبسّط */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
              <path
                d="M28 12 L46 8 L64 14 L78 26 L82 40 L76 52 L70 62 L62 74 L54 86 L44 90 L34 86 L28 74 L24 58 L22 40 L24 24 Z"
                fill="#EFE3C6"
                stroke="#CFA93A"
                strokeWidth="0.6"
                opacity="0.9"
              />
              <path
                d="M24 58 L34 62 L44 70 L50 80"
                fill="none"
                stroke="#CFA93A"
                strokeWidth="0.3"
                opacity="0.5"
                strokeDasharray="1 1.5"
              />
              {/* مسار الرحلة */}
              <path
                d="M42 76 L44 72 L51 36 L60 46"
                fill="none"
                stroke="#1F5C4F"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                opacity="0.7"
              />
            </svg>

            {Object.entries(counts).map(([k, c]) => {
              const size = 22 + (c.n / max) * 34;
              return (
                <div
                  key={k}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className="flex items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#CFA93A] to-[#8B6A12] font-bold text-white shadow-lg"
                      style={{ width: size, height: size, fontSize: Math.max(11, size / 2.6) }}
                    >
                      {c.n}
                    </div>
                    <span className="mt-1 whitespace-nowrap rounded bg-white/85 px-1.5 py-0.5 font-arabic text-[10px] text-navy shadow">
                      {c.ar}
                    </span>
                  </div>
                </div>
              );
            })}
            {total === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-navy/50">
                {rows.length === 0
                  ? ar
                    ? "سجّل دخولك لعرض الخريطة"
                    : "Sign in to view"
                  : ar
                    ? "لا توجد مدن مسجّلة في هذه الحقبة"
                    : "No cities recorded"}
              </div>
            )}
          </div>

          <div className="mt-5 px-2">
            <div className="text-center font-arabic text-lg text-navy">
              {ar ? ERAS[era].ar : ERAS[era].en}
            </div>
            <input
              type="range"
              min={0}
              max={ERAS.length - 1}
              value={era}
              onChange={(e) => {
                setPlaying(false);
                setEra(Number(e.target.value));
              }}
              className="mt-3 w-full accent-[#CFA93A]"
            />
            <div className="mt-1 flex justify-between text-[10px] text-navy/40">
              {ERAS.map((e, i) => (
                <span key={i}>{e.from || "…"}</span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="btn-gold !px-5 !py-2 !text-sm"
              >
                {playing ? (ar ? "⏸ إيقاف" : "⏸ Pause") : ar ? "▶ شغّل الرحلة" : "▶ Play"}
              </button>
              <span className="text-sm text-navy/60">
                {ar
                  ? `${total} فرداً في ${Object.keys(counts).length} مدينة`
                  : `${total} in ${Object.keys(counts).length} cities`}
              </span>
            </div>
            {unknown > 0 && (
              <p className="mt-3 text-center text-xs text-navy/50">
                {ar
                  ? `${unknown} فرداً بلا مدينة مسجّلة — أضفها من لوحة التحكم لتظهر على الخريطة`
                  : `${unknown} without a city`}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
