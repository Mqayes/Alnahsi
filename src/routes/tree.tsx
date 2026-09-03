import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Ornament } from "@/components/site/Ornament";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/tree")({
  head: () => ({
    meta: [
      { title: "شجرة العائلة — آل بوخف الناهسي" },
      {
        name: "description",
        content: "شجرة نسب عائلة آل بوخف الناهسي — من الحفائر وبلاد ناهس القاعة إلى الأجيال الحديثة",
      },
    ],
  }),
  component: FamilyTreePage,
});

// ─── Data ──────────────────────────────────────────────────────────────────

const NASAB_CHAIN = [
  { ar: "خثعم", en: "Khath'am" },
  { ar: "ناهس شهران", en: "Nahas Shahran" },
  { ar: "المزارقة", en: "Al-Mazarigah" },
  { ar: "آل بوخف", en: "Al Bukhuf" },
];

const GENERATIONS = [
  {
    num: "١",
    year: { ar: "ما قبل ١٨٣٤ م", en: "Pre-1834" },
    title: { ar: "نشأة الأجداد", en: "The First Ancestors" },
    location: { ar: "الحفائر · بلاد ناهس القاعة", en: "Al-Hafayer · Nahas Al-Qa'a" },
    desc: {
      ar: "نشأ أجدادنا في الحفائر بخيلهم وأنعامهم، متنقلين بين ضواحي بلاد ناهس القاعة في جنوب غرب الجزيرة العربية. كانوا أصحاب أصالة وفروسية، يرعون حلالهم ويحمون أرضهم.",
      en: "Our ancestors grew up in Al-Hafayer with their horses and livestock, moving through the lands of Nahas Al-Qa'a in southwestern Arabia. Men of honor and horses, they tended their herds and protected their land.",
    },
    members: [],
    color: "from-[#8B3A12] to-[#C05A20]",
  },
  {
    num: "٢",
    year: { ar: "١٨٣٤ م", en: "1834" },
    title: { ar: "سعود مفلح آل بوخف", en: "Saud Muflih Al Bukhuf" },
    location: { ar: "تندحه · بلاد ناهس", en: "Tanduhah · Nahas Lands" },
    desc: {
      ar: "وسّع الجيل الثاني التجارة في الأنعام والزراعة في تندحه وبلاد ناهس القاعة. كان صاحب مزارع وأبل وخيل، يوفر للناس عملاً ويسخر ماله وسمعته لأهله وجيرانه وعابر السبيل.",
      en: "The second generation expanded trade in livestock and agriculture across Tanduhah and Nahas lands. A man of farms, camels, and horses — he devoted his wealth and reputation to his family, neighbors, and travelers.",
    },
    members: [{ ar: "سعود مفلح آل بوخف", en: "Saud Muflih Al Bukhuf" }],
    color: "from-[#1A5C52] to-[#2A8C7A]",
  },
  {
    num: "٣",
    year: { ar: "١٩٠٢ — ١٩٤٠ م", en: "1902 — 1940" },
    title: { ar: "الشيخ سعود فهد آل بوخف", en: "Sheikh Saud Fahd Al Bukhuf" },
    location: { ar: "تندحه · القصيم · تبوك · الرياض", en: "Tanduhah · Qassim · Tabuk · Riyadh" },
    desc: {
      ar: "أسّس الجيل الثالث مسيرة الزراعة امتداداً لتاريخ تندحه، عبر مزارع في القصيم وتبوك. ثم أسّس نواة أول استقرار للعائلة في نجد الرياض — نقطة تحوّل في مسار عائلة آل بوخف.",
      en: "The third generation extended the agricultural legacy of Tanduhah with farms in Qassim and Tabuk, then established the family's first settlement in Riyadh — a turning point in the Al Bukhuf story.",
    },
    members: [{ ar: "الشيخ سعود فهد آل بوخف الناهسي", en: "Sheikh Saud Fahd Al Bukhuf Alnahsi" }],
    color: "from-[#3A2A70] to-[#6A5AAA]",
  },
  {
    num: "٤",
    year: { ar: "١٩٤٠ — ١٩٩٠ م", en: "1940 — 1990" },
    title: { ar: "جيل التوسع والانتشار", en: "Generation of Expansion" },
    location: { ar: "الرياض · المملكة العربية السعودية", en: "Riyadh · Saudi Arabia" },
    desc: {
      ar: "أكمل هذا الجيل المسيرة في خدمة الدين والوطن، والارتقاء بمسار أعمال العائلة إلى التجارة والصناعة عبر تأسيس شركات في الرياض. وانتشر أبناء الجيل في الجهات الحكومية والأعمال الخاصة.",
      en: "This generation completed the journey in service to faith and country, elevating the family business to trade and industry through Riyadh-based companies. Members spread across government and private sectors.",
    },
    members: [
      { ar: "فهد", en: "Fahd" },
      { ar: "سعود", en: "Saud" },
      { ar: "خالد", en: "Khalid" },
      { ar: "عبدالله", en: "Abdullah" },
      { ar: "مفلح", en: "Muflih" },
    ],
    color: "from-[#2A4A80] to-[#5A7AAA]",
  },
  {
    num: "٥",
    year: { ar: "١٩٩٠ م — الآن", en: "1990 — Present" },
    title: { ar: "الجيل الحالي", en: "The Living Generation" },
    location: { ar: "الرياض وما وراءها", en: "Riyadh & Beyond" },
    desc: {
      ar: "يكتب الجيل الخامس الفصل الجديد — في التجارة والصناعة والاستثمار، محافظاً على اسم آل بوخف ومحملاً بإرث أجيال من الصدق والكرم والوفاء.",
      en: "The fifth generation writes the new chapter — in commerce, industry, and investment — carrying the Al Bukhuf name with the inherited values of integrity, generosity, and loyalty.",
    },
    members: [
      { ar: "محمد", en: "Mohammed" },
      { ar: "سلطان", en: "Sultan" },
      { ar: "مفلح", en: "Muflih" },
      { ar: "عبدالرحمن", en: "Abdulrahman" },
      { ar: "أحمد", en: "Ahmad" },
      { ar: "عبدالعزيز", en: "Abdulaziz" },
      { ar: "يوسف", en: "Yusuf" },
      { ar: "إبراهيم", en: "Ibrahim" },
    ],
    color: "from-[#5A4A20] to-[#9A8040]",
  },
];

const VALUES = [
  { ar: "الأمانة", en: "Integrity", icon: "⚖" },
  { ar: "الكرم", en: "Generosity", icon: "☕" },
  { ar: "الوفاء", en: "Loyalty", icon: "🤝" },
  { ar: "العلم", en: "Knowledge", icon: "📖" },
  { ar: "الصبر", en: "Patience", icon: "⏳" },
];

// ─── Page ──────────────────────────────────────────────────────────────────

function FamilyTreePage() {
  const { lang } = useLang();
  const isAr = lang === "ar";

  return (
    <main className="min-h-screen" dir={isAr ? "rtl" : "ltr"}>

      {/* ── HEADER HERO ─────────────────────────── */}
      <section className="relative bg-navy pb-20 pt-40 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,#D4AF37_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(184,136,10,0.12)_0%,transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-6">
          <div className="eyebrow mb-4">
            {isAr ? "النسب" : "Lineage"}
          </div>
          <h1 className="font-arabic text-6xl text-gold drop-shadow-[0_4px_20px_rgba(212,175,55,0.3)] md:text-8xl">
            {isAr ? "شجرة العائلة" : "Family Tree"}
          </h1>
          <Ornament className="mx-auto mt-8" />
          <p className="mx-auto mt-6 max-w-2xl font-serif-display text-lg italic text-cream/70 md:text-xl">
            {isAr
              ? "أربعة أجيال — اسمٌ واحد"
              : "Four generations — one name"}
          </p>
        </div>
      </section>

      {/* ── NASAB CHAIN ─────────────────────────── */}
      <div className="bg-navy/95 border-y border-gold/15 py-5">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-6">
          {NASAB_CHAIN.map((node, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className={`font-arabic text-base ${
                  i === NASAB_CHAIN.length - 1
                    ? "text-gold font-bold"
                    : "text-gold/60"
                }`}
              >
                {isAr ? node.ar : node.en}
              </span>
              {i < NASAB_CHAIN.length - 1 && (
                <span className="text-gold/30 text-sm">←</span>
              )}
            </div>
          ))}
          <span className="mx-2 text-gold/20">—</span>
          <span className="font-cinzel text-xs uppercase tracking-[0.18em] text-cream/30">
            {isAr ? "الحفائر · بلاد ناهس القاعة · منذ ٥٧١ م" : "Al-Hafayer · Nahas Al-Qa'a · since 571 CE"}
          </span>
        </div>
      </div>

      {/* ── VISUAL TREE ─────────────────────────── */}
      <section className="bg-parchment py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mb-12 text-center">
              <div className="eyebrow mb-3">
                {isAr ? "الشجرة البصرية" : "Visual Tree"}
              </div>
              <h2 className="text-3xl md:text-4xl">
                {isAr ? "النسب من الجذر" : "Lineage from the Root"}
              </h2>
            </div>
          </Reveal>

          {/* Tree visual */}
          <div className="bg-white border border-gold/25 p-8 md:p-12 relative overflow-hidden">
            {/* corner ornaments */}
            <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-gold/50" />
            <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-gold/50" />

            <div className="flex flex-col items-center">
              {/* Root */}
              <div className="bg-gold text-navy font-arabic font-bold text-base px-8 py-3 tracking-wide min-w-[220px] text-center">
                {isAr ? "آل بوخف الناهسي" : "Al Bukhuf Alnahsi"}
              </div>
              <div className="w-px h-8 bg-gold/40" />

              {/* Gen 2 */}
              <div className="flex flex-col items-center">
                <div className="bg-navy/90 text-gold/90 font-arabic text-sm px-6 py-2.5 border border-gold/30 min-w-[200px] text-center">
                  <span className="block text-gold/40 font-cinzel text-[10px] uppercase tracking-widest mb-1">1834</span>
                  {isAr ? "سعود مفلح آل بوخف" : "Saud Muflih Al Bukhuf"}
                </div>
                <div className="w-px h-8 bg-gold/30" />
              </div>

              {/* Gen 3 */}
              <div className="flex flex-col items-center">
                <div className="bg-navy/80 text-gold/80 font-arabic text-sm px-6 py-2.5 border border-gold/25 min-w-[240px] text-center">
                  <span className="block text-gold/40 font-cinzel text-[10px] uppercase tracking-widest mb-1">1940</span>
                  {isAr ? "الشيخ سعود فهد آل بوخف الناهسي" : "Sheikh Saud Fahd Al Bukhuf"}
                </div>
                <div className="w-px h-8 bg-gold/25" />
              </div>

              {/* Gen 4 row */}
              <div className="w-full max-w-2xl relative">
                <div className="absolute top-0 right-[15%] left-[15%] h-px bg-gold/25" />
                <div className="flex justify-center gap-4 md:gap-6 flex-wrap pt-0">
                  {["فهد", "سعود", "خالد", "عبدالله", "مفلح"].map((name, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-px h-8 bg-gold/20" />
                      <div className="bg-[#FAF0D0] text-[#1A1408] font-arabic text-sm px-4 py-2 border border-gold/30 text-center min-w-[80px]">
                        {isAr ? name : ["Fahd","Saud","Khalid","Abdullah","Muflih"][i]}
                      </div>
                      <div className="w-px h-6 bg-gold/15" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Gen 5 row */}
              <div className="w-full max-w-3xl mt-0">
                <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
                  {[
                    {ar:"محمد",en:"Mohammed"},{ar:"سلطان",en:"Sultan"},{ar:"مفلح",en:"Muflih"},
                    {ar:"عبدالرحمن",en:"Abdulrahman"},{ar:"أحمد",en:"Ahmad"},
                    {ar:"عبدالعزيز",en:"Abdulaziz"},{ar:"يوسف",en:"Yusuf"},{ar:"إبراهيم",en:"Ibrahim"},
                  ].map((m, i) => (
                    <div key={i} className="bg-parchment border border-gold/20 text-[#5A4520] font-arabic text-xs px-3 py-1.5 text-center">
                      {isAr ? m.ar : m.en}
                    </div>
                  ))}
                  <div className="bg-parchment border border-gold/15 border-dashed text-[#9A7840] font-cinzel text-xs px-3 py-1.5 text-center">
                    · · ·
                  </div>
                </div>
              </div>

              <p className="mt-8 text-center font-cinzel text-xs uppercase tracking-[0.15em] text-navy/30">
                {isAr
                  ? "· سجّل في بوابة العائلة لإضافة اسمك للشجرة ·"
                  : "· Sign in to the Family Portal to add your name ·"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GENERATIONS DETAIL ──────────────────── */}
      <section className="bg-navy py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="mb-16 text-center">
              <div className="eyebrow mb-3">{isAr ? "الأجيال" : "Generations"}</div>
              <h2 className="text-4xl text-cream md:text-5xl">
                {isAr ? "خمسة أجيال — مسيرة لم تتوقف" : "Five Generations — A Journey Without Pause"}
              </h2>
              <Ornament className="mx-auto mt-6" />
            </div>
          </Reveal>

          <div className="space-y-6">
            {GENERATIONS.map((gen, i) => (
              <Reveal key={i}>
                <div className="border border-gold/15 bg-navy/60 overflow-hidden">
                  <div className="flex items-stretch">
                    {/* number strip */}
                    <div className={`flex w-16 shrink-0 items-center justify-center bg-gradient-to-b ${gen.color} text-white`}>
                      <span className="font-arabic text-2xl font-bold">{gen.num}</span>
                    </div>
                    {/* content */}
                    <div className="flex-1 p-6 md:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                          <span className="font-cinzel text-xs uppercase tracking-[0.22em] text-gold">
                            {isAr ? gen.year.ar : gen.year.en}
                          </span>
                          <h3 className="mt-1 font-arabic text-xl text-cream md:text-2xl">
                            {isAr ? gen.title.ar : gen.title.en}
                          </h3>
                        </div>
                        <span className="text-xs text-cream/30 font-cinzel uppercase tracking-wider">
                          {isAr ? gen.location.ar : gen.location.en}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-cream/60">
                        {isAr ? gen.desc.ar : gen.desc.en}
                      </p>
                      {gen.members.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {gen.members.map((m, j) => (
                            <span
                              key={j}
                              className="border border-gold/30 bg-gold/8 px-3 py-1 font-arabic text-sm text-gold/80"
                            >
                              {isAr ? m.ar : m.en}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ──────────────────────────────── */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="mb-12 text-center">
              <div className="eyebrow mb-3">{isAr ? "ما نتوارثه" : "Our Inheritance"}</div>
              <h2 className="text-3xl md:text-4xl">
                {isAr ? "قيمٌ لا تُباع ولا تُشترى" : "Values That Cannot Be Bought or Sold"}
              </h2>
              <Ornament className="mx-auto mt-6" />
            </div>
          </Reveal>
          <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-5">
            {VALUES.map((v, i) => (
              <div key={i} className="flex flex-col items-center bg-cream p-8 text-center transition-colors hover:bg-parchment">
                <span className="text-3xl">{v.icon}</span>
                <span className="mt-4 font-arabic text-3xl text-gold">{v.ar}</span>
                <h3 className="mt-3 font-cinzel text-sm uppercase tracking-[0.22em] text-navy">{v.ar}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTAL CTA ──────────────────────────── */}
      <section className="relative bg-navy py-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(184,136,10,0.1)_0%,transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-xl px-6">
          <div className="eyebrow mb-4">{isAr ? "بوابة العائلة" : "Family Portal"}</div>
          <h2 className="text-3xl text-cream md:text-4xl">
            {isAr ? "أضف اسمك إلى الشجرة" : "Add Your Name to the Tree"}
          </h2>
          <Ornament className="mx-auto mt-6 mb-8" />
          <p className="font-serif-display italic text-cream/60 mb-10">
            {isAr
              ? "سجّل في بوابة العائلة وأضف بياناتك ليبقى اسمك في سجل آل بوخف الناهسي للأبد"
              : "Sign in to the Family Portal and add your name to the permanent Al Bukhuf Alnahsi record"}
          </p>
          <a
            href="/portal"
            className="btn-gold inline-flex"
          >
            {isAr ? "ادخل بوابة العائلة" : "Enter Family Portal"}
          </a>
        </div>
      </section>

    </main>
  );
}
