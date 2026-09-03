import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";

const FEATURES = [
  { icon: "🌳", to: "/tree",    ar: "الشجرة التفاعلية", en: "Interactive Tree",  dAr: "تصفّح الأجيال، ابحث عن اسم، وأضف نفسك للفرع الصحيح.", dEn: "Browse generations, search a name, add yourself to the right branch." },
  { icon: "📜", to: "/our-story", ar: "توثيق النسب",     en: "Lineage Record",    dAr: "خثعم ← ناهس شهران ← المزارقة ← آل بوخف، موثق بالتواريخ والأماكن.", dEn: "Khath'am → Nahas → Al-Mazarigah → Al Bukhuf, with dates and places." },
  { icon: "🖼️", to: "/gallery",  ar: "أرشيف العائلة",   en: "Family Archive",    dAr: "صور قديمة ووثائق ومخطوطات محفوظة خلف باب العائلة.", dEn: "Old photos, documents and manuscripts kept behind the family door." },
  { icon: "📰", to: "/news",     ar: "الأخبار والمناسبات", en: "News & Events",   dAr: "إعلانات العائلة، المناسبات، والتهاني في مكان واحد.", dEn: "Family announcements, occasions and greetings in one place." },
  { icon: "👥", to: "/portal",   ar: "دليل الأفراد",    en: "Members Directory", dAr: "دليل خاص لأبناء العائلة مع بيانات التواصل.", dEn: "A private directory of family members with contact details." },
  { icon: "🔐", to: "/portal",   ar: "الخصوصية",        en: "Privacy",           dAr: "المحتوى الخاص لا يظهر إلا للأعضاء المعتمدين من المشرف.", dEn: "Private content is visible only to admin-approved members." },
];

export function Platform() {
  const { lang } = useLang();
  const ar = lang === "ar";
  return (
    <section className="bg-cream py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">{ar ? "منصة العائلة" : "Family Platform"}</div>
            <h2 className="mt-4 text-4xl md:text-5xl">{ar ? "تواصلٌ مُمتد بين الأجيال" : "A connection that spans generations"}</h2>
            <Ornament className="mt-6" />
            <p className="mt-6 text-lg italic text-foreground/75">
              {ar ? "نهدف إلى تعزيز الترابط العائلي وتوثيق المعلومات لتثري الأجيال القادمة." : "We strengthen family ties and preserve our record for the generations to come."}
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 60}>
              <Link to={f.to} className="group block h-full rounded-xl border border-gold/25 bg-white p-8 shadow-[0_10px_40px_rgba(10,25,47,0.05)] transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_18px_50px_rgba(201,162,39,0.18)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-parchment text-2xl">{f.icon}</div>
                <h3 className="mt-6 font-arabic text-2xl text-navy">{ar ? f.ar : f.en}</h3>
                <p className="mt-3 leading-relaxed text-navy/65">{ar ? f.dAr : f.dEn}</p>
                <span className="mt-5 inline-block text-sm text-gold transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">{ar ? "استكشف ←" : "Explore →"}</span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-20 grid gap-px overflow-hidden rounded-xl border border-gold/25 bg-gold/25 sm:grid-cols-4">
            {[
              { n: "٥٧١", l: ar ? "ميلادية · بداية التاريخ" : "CE · The beginning" },
              { n: "١٨٣٤", l: ar ? "بداية التجارة" : "Trade begins" },
              { n: "٤+", l: ar ? "أجيال موثقة" : "Documented generations" },
              { n: "ناهس", l: ar ? "الجذر القبلي" : "Tribal root" },
            ].map((s, i) => (
              <div key={i} className="bg-white p-8 text-center">
                <div className="font-arabic text-4xl text-gold">{s.n}</div>
                <div className="mt-2 text-sm text-navy/60">{s.l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
