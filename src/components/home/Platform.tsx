import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";

const I = {
  tree: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="4" r="2.2" />
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="19" cy="12" r="2.2" />
      <circle cx="5" cy="20" r="2.2" />
      <circle cx="12" cy="20" r="2.2" />
      <circle cx="19" cy="20" r="2.2" />
      <path d="M12 6v2.5M12 8.5H5v1.3M12 8.5h7v1.3M5 14.2V17.8M12 14.2V17.8M19 14.2V17.8M12 14.2H5M12 14.2h7" />
    </svg>
  ),
  scroll: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7" />
      <path d="M7 4a2 2 0 0 0-2 2v2h4V6a2 2 0 0 0-2-2ZM7 20a2 2 0 0 1-2-2v-2h4v2a2 2 0 0 1-2 2Z" />
      <path d="M11 9h6M11 12h6M11 15h4" />
    </svg>
  ),
  archive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 15l5-5 4 4 3-3 6 6" />
      <circle cx="16" cy="9" r="1.5" />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 5h12v14H6a2 2 0 0 1-2-2Z" />
      <path d="M16 9h4v8a2 2 0 0 1-2 2" />
      <path d="M7 9h6M7 12h6M7 15h4" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M15 14c2.8 0 5 1.8 5 4.5" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15" r="1.3" />
    </svg>
  ),
};

const FEATURES = [
  {
    icon: I.tree,
    to: "/tree",
    ar: "الشجرة التفاعلية",
    en: "Interactive Tree",
    dAr: "تصفّح الأجيال وابحث عن اسم وأضف نفسك.",
    dEn: "Browse generations, search, add yourself.",
  },
  {
    icon: I.scroll,
    to: "/our-story",
    ar: "توثيق النسب",
    en: "Lineage Record",
    dAr: "ناهس شهران ← المزارقة ← آل بوخف.",
    dEn: "Nahas Shahran → Al-Mazarigah → Al Bukhuf.",
  },
  {
    icon: I.archive,
    to: "/gallery",
    ar: "أرشيف العائلة",
    en: "Family Archive",
    dAr: "صور ووثائق ومخطوطات محفوظة.",
    dEn: "Photos, documents and manuscripts.",
  },
  {
    icon: I.news,
    to: "/news",
    ar: "الأخبار والمناسبات",
    en: "News & Events",
    dAr: "إعلانات العائلة ومناسباتها.",
    dEn: "Family announcements and occasions.",
  },
  {
    icon: I.users,
    to: "/portal",
    ar: "دليل الأفراد",
    en: "Members Directory",
    dAr: "دليل خاص لأبناء العائلة.",
    dEn: "A private members directory.",
  },
  {
    icon: I.lock,
    to: "/portal",
    ar: "الخصوصية",
    en: "Privacy",
    dAr: "المحتوى الخاص للمعتمدين فقط.",
    dEn: "Private content for approved members.",
  },
];

export function Platform() {
  const { lang } = useLang();
  const ar = lang === "ar";
  return (
    <section className="pattern-bg bg-cream py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow-pill">✦ {ar ? "منصة العائلة" : "Family Platform"}</span>
            <h2 className="mt-5 text-4xl md:text-5xl">
              {ar ? "تواصلٌ مُمتد بين الأجيال" : "A bond that spans generations"}
            </h2>
            <Ornament className="mt-5" />
            <p className="mt-5 text-base italic text-navy/65 md:text-lg">
              {ar
                ? "نعزّز الترابط العائلي ونوثّق الذاكرة لتثري الأجيال القادمة."
                : "We strengthen family ties and preserve memory for generations to come."}
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-3 md:mt-16 md:grid-cols-3 md:gap-6">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 50}>
              <Link to={f.to} className="premium-card group flex h-full flex-col p-5 md:p-7">
                <div className="icon-badge">{f.icon}</div>
                <h3 className="mt-4 font-arabic text-lg leading-tight text-navy md:text-2xl">
                  {ar ? f.ar : f.en}
                </h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-navy/60 md:text-sm">
                  {ar ? f.dAr : f.dEn}
                </p>
                <span className="mt-4 text-xs font-medium text-gold transition-transform group-hover:-translate-x-1 md:text-sm">
                  {ar ? "استكشف ←" : "Explore →"}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="emerald-band mt-14 rounded-2xl p-6 md:mt-20 md:p-10">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {[
                { n: "٥٧١", l: ar ? "ميلادية · بداية التاريخ" : "CE · The beginning" },
                { n: "١٨٣٤", l: ar ? "بداية التجارة" : "Trade begins" },
                { n: "٥", l: ar ? "أجيال موثقة" : "Documented generations" },
                { n: "ناهس", l: ar ? "الجذر القبلي" : "Tribal root" },
              ].map((s, i) => (
                <div key={i} className="stat-tile">
                  <div className="font-arabic text-3xl text-[#F0CC60] md:text-4xl">{s.n}</div>
                  <div className="mt-1 text-[11px] text-cream/75 md:text-sm">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
