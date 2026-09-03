import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Ornament } from "@/components/site/Ornament";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/tree")({
  head: () => ({
    meta: [
      { title: "شجرة العائلة — آل بوخف الناهسي" },
      { name: "description", content: "شجرة نسب عائلة آل بوخف الناهسي — من الحفائر وبلاد ناهس القاعة إلى الأجيال الحديثة" },
    ],
  }),
  component: FamilyTreePage,
});

type N = { ar: string; en: string };

const NASAB: N[] = [
  { ar: "خثعم", en: "Khath'am" },
  { ar: "ناهس شهران", en: "Nahas Shahran" },
  { ar: "المزارقة", en: "Al-Mazarigah" },
  { ar: "آل بوخف", en: "Al Bukhuf" },
];

const GEN4: N[] = [
  { ar: "فهد", en: "Fahd" }, { ar: "سعود", en: "Saud" }, { ar: "خالد", en: "Khalid" },
  { ar: "عبدالله", en: "Abdullah" }, { ar: "مفلح", en: "Muflih" },
];
const GEN5: N[] = [
  { ar: "محمد", en: "Mohammed" }, { ar: "سلطان", en: "Sultan" }, { ar: "مفلح", en: "Muflih" },
  { ar: "عبدالرحمن", en: "Abdulrahman" }, { ar: "أحمد", en: "Ahmad" }, { ar: "عبدالعزيز", en: "Abdulaziz" },
  { ar: "يوسف", en: "Yusuf" }, { ar: "إبراهيم", en: "Ibrahim" },
];

const GENERATIONS = [
  {
    num: "١", year: { ar: "ما قبل ١٨٣٤ م", en: "Before 1834" },
    title: { ar: "نشأة الأجداد", en: "The First Ancestors" },
    place: { ar: "الحفائر · بلاد ناهس القاعة", en: "Al-Hafayer · Nahas Al-Qa'a" },
    desc: {
      ar: "نشأ أجدادنا في الحفائر بخيلهم وأنعامهم، متنقلين بين ضواحي بلاد ناهس القاعة في جنوب غرب الجزيرة العربية. كانوا أصحاب أصالة وفروسية، يرعون حلالهم ويحمون أرضهم.",
      en: "Our ancestors grew up in Al-Hafayer with their horses and livestock, moving through the lands of Nahas Al-Qa'a in southwestern Arabia.",
    },
    members: [] as N[],
  },
  {
    num: "٢", year: { ar: "١٨٣٤ م", en: "1834" },
    title: { ar: "سعود مفلح آل بوخف", en: "Saud Muflih Al Bukhuf" },
    place: { ar: "تندحه · بلاد ناهس", en: "Tanduhah · Nahas Lands" },
    desc: {
      ar: "وسّع الجيل الثاني التجارة في الأنعام والزراعة في تندحه وبلاد ناهس القاعة. كان صاحب مزارع وأبل وخيل، يوفر للناس عملاً ويسخر ماله وسمعته لأهله وجيرانه وعابر السبيل.",
      en: "The second generation expanded trade in livestock and agriculture across Tanduhah — a man of farms, camels, and horses who devoted his wealth and reputation to his people.",
    },
    members: [{ ar: "سعود مفلح آل بوخف", en: "Saud Muflih Al Bukhuf" }],
  },
  {
    num: "٣", year: { ar: "١٩٠٢ — ١٩٤٠ م", en: "1902 — 1940" },
    title: { ar: "الشيخ سعود فهد آل بوخف", en: "Sheikh Saud Fahd Al Bukhuf" },
    place: { ar: "تندحه · القصيم · تبوك · الرياض", en: "Tanduhah · Qassim · Tabuk · Riyadh" },
    desc: {
      ar: "أسّس الجيل الثالث مسيرة الزراعة امتداداً لتاريخ تندحه عبر مزارع في القصيم وتبوك، ثم أسّس نواة أول استقرار للعائلة في نجد الرياض — نقطة تحوّل في مسار عائلة آل بوخف.",
      en: "The third generation extended the agricultural legacy with farms in Qassim and Tabuk, then established the family's first settlement in Riyadh — a turning point.",
    },
    members: [{ ar: "الشيخ سعود فهد آل بوخف الناهسي", en: "Sheikh Saud Fahd Al Bukhuf Alnahsi" }],
  },
  {
    num: "٤", year: { ar: "١٩٤٠ — ١٩٩٠ م", en: "1940 — 1990" },
    title: { ar: "جيل التوسع والانتشار", en: "Generation of Expansion" },
    place: { ar: "الرياض · المملكة العربية السعودية", en: "Riyadh · Saudi Arabia" },
    desc: {
      ar: "أكمل هذا الجيل المسيرة في خدمة الدين والوطن، والارتقاء بأعمال العائلة إلى التجارة والصناعة عبر تأسيس شركات في الرياض. وانتشر أبناؤه في الجهات الحكومية والأعمال الخاصة.",
      en: "This generation elevated the family business to trade and industry through Riyadh-based companies, spreading across government and private sectors.",
    },
    members: GEN4,
  },
  {
    num: "٥", year: { ar: "١٩٩٠ م — الآن", en: "1990 — Present" },
    title: { ar: "الجيل الحالي", en: "The Living Generation" },
    place: { ar: "الرياض وما وراءها", en: "Riyadh & Beyond" },
    desc: {
      ar: "يكتب الجيل الخامس الفصل الجديد — في التجارة والصناعة والاستثمار، محافظاً على اسم آل بوخف ومحملاً بإرث أجيال من الصدق والكرم والوفاء.",
      en: "The fifth generation writes the new chapter — in commerce, industry, and investment — carrying the inherited values of integrity, generosity, and loyalty.",
    },
    members: GEN5,
  },
];

function Node({ label, level }: { label: string; level: 0 | 1 | 2 | 3 }) {
  const styles = [
    "bg-gold text-white font-bold text-lg px-10 py-4 shadow-[0_8px_30px_rgba(212,175,55,0.35)]",
    "bg-white text-navy font-bold text-base px-7 py-3 border border-gold/50 shadow-[0_4px_18px_rgba(212,175,55,0.15)]",
    "bg-white text-navy text-sm px-5 py-2.5 border border-gold/35 shadow-sm",
    "bg-parchment text-navy/80 text-sm px-4 py-2 border border-gold/25",
  ];
  return (
    <div className={`font-arabic rounded-sm text-center whitespace-nowrap transition-transform hover:-translate-y-0.5 ${styles[level]}`}>
      {label}
    </div>
  );
}

function FamilyTreePage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const p = (n: N) => (ar ? n.ar : n.en);

  return (
    <main className="min-h-screen bg-parchment" dir={ar ? "rtl" : "ltr"}>

      {/* HERO — light */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream via-parchment to-parchment pb-16 pt-40 text-center">
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,#D4AF37_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="relative z-10 mx-auto max-w-4xl px-6">
          <div className="eyebrow">{ar ? "النسب" : "Lineage"}</div>
          <h1 className="mt-6 font-arabic text-6xl leading-none text-navy md:text-8xl">
            {ar ? "شجرة العائلة" : "Family Tree"}
          </h1>
          <Ornament className="mt-8" />
          <p className="mx-auto mt-6 max-w-2xl font-serif-display text-xl italic text-navy/60 md:text-2xl">
            {ar ? "خمسة أجيال — اسمٌ واحد" : "Five generations — one name"}
          </p>

          {/* nasab chain */}
          <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-gold/30 bg-white/70 px-7 py-3 shadow-sm backdrop-blur">
            {NASAB.map((n, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className={`font-arabic text-base ${i === NASAB.length - 1 ? "font-bold text-gold" : "text-navy/70"}`}>{p(n)}</span>
                {i < NASAB.length - 1 && <span className="text-gold/50">{ar ? "←" : "→"}</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* VISUAL TREE */}
      <section className="bg-parchment px-4 pb-24 pt-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="relative overflow-x-auto rounded-md border border-gold/25 bg-white p-8 shadow-[0_20px_60px_rgba(10,25,47,0.08)] md:p-14">
              <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-gold/60" />
              <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-gold/60" />

              <div className="flex min-w-[640px] flex-col items-center">
                <Node label={ar ? "آل بوخف الناهسي" : "Al Bukhuf Alnahsi"} level={0} />
                <div className="h-10 w-px bg-gold/40" />

                <div className="text-[11px] tracking-[0.25em] text-gold font-cinzel uppercase mb-2">1834</div>
                <Node label={ar ? "سعود مفلح آل بوخف" : "Saud Muflih Al Bukhuf"} level={1} />
                <div className="h-10 w-px bg-gold/40" />

                <div className="text-[11px] tracking-[0.25em] text-gold font-cinzel uppercase mb-2">1940</div>
                <Node label={ar ? "الشيخ سعود فهد آل بوخف الناهسي" : "Sheikh Saud Fahd Al Bukhuf"} level={1} />
                <div className="h-10 w-px bg-gold/40" />

                {/* gen 4 */}
                <div className="relative w-full max-w-3xl">
                  <div className="absolute left-[10%] right-[10%] top-0 h-px bg-gold/40" />
                  <div className="flex justify-between px-[10%]">
                    {GEN4.map((n, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="h-8 w-px bg-gold/40" />
                        <Node label={p(n)} level={2} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-10 w-px bg-gold/30" />

                {/* gen 5 */}
                <div className="w-full max-w-3xl">
                  <div className="mb-4 h-px w-full bg-gold/25" />
                  <div className="flex flex-wrap justify-center gap-3">
                    {GEN5.map((n, i) => <Node key={i} label={p(n)} level={3} />)}
                    <div className="rounded-sm border border-dashed border-gold/40 px-4 py-2 text-sm text-gold">+ ···</div>
                  </div>
                </div>

                <Link to="/portal" className="mt-10 font-cinzel text-xs uppercase tracking-[0.2em] text-gold hover:text-navy transition-colors">
                  {ar ? "✦ أضف اسمك إلى الشجرة" : "✦ Add your name to the tree"}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* GENERATIONS */}
      <section className="bg-cream py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="mb-16 text-center">
              <div className="eyebrow">{ar ? "الأجيال" : "Generations"}</div>
              <h2 className="mt-4 text-4xl md:text-5xl">{ar ? "مسيرة لم تتوقف" : "A Journey Without Pause"}</h2>
              <Ornament className="mt-6" />
            </div>
          </Reveal>

          <div className="relative">
            <div className={`absolute top-0 bottom-0 w-px bg-gold/30 ${ar ? "right-8" : "left-8"} hidden md:block`} />
            <div className="space-y-8">
              {GENERATIONS.map((g, i) => (
                <Reveal key={i}>
                  <div className={`relative md:${ar ? "pr-24" : "pl-24"}`}>
                    <div className={`absolute top-6 hidden h-16 w-16 items-center justify-center rounded-full border border-gold/50 bg-white shadow-md md:flex ${ar ? "right-0" : "left-0"}`}>
                      <span className="font-arabic text-2xl text-gold">{g.num}</span>
                    </div>
                    <article className="rounded-md border border-gold/20 bg-white p-7 shadow-[0_10px_40px_rgba(10,25,47,0.06)] transition-shadow hover:shadow-[0_14px_50px_rgba(212,175,55,0.15)] md:p-9">
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-cinzel text-xs uppercase tracking-[0.22em] text-gold">{p(g.year)}</span>
                        <span className="text-xs text-navy/45">{p(g.place)}</span>
                      </div>
                      <h3 className="font-arabic text-2xl text-navy md:text-3xl">{p(g.title)}</h3>
                      <p className="mt-4 leading-relaxed text-navy/70">{p(g.desc)}</p>
                      {g.members.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {g.members.map((m, j) => (
                            <span key={j} className="rounded-full border border-gold/40 bg-parchment px-4 py-1.5 font-arabic text-sm text-navy">{p(m)}</span>
                          ))}
                        </div>
                      )}
                    </article>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA — light */}
      <section className="bg-parchment py-24 text-center">
        <Reveal>
          <div className="mx-auto max-w-xl px-6">
            <div className="eyebrow">{ar ? "بوابة العائلة" : "Family Portal"}</div>
            <h2 className="mt-4 text-4xl md:text-5xl">{ar ? "أضف اسمك إلى الشجرة" : "Add Your Name to the Tree"}</h2>
            <Ornament className="mt-6" />
            <p className="mt-6 font-serif-display text-lg italic text-navy/60">
              {ar ? "سجّل في بوابة العائلة ليبقى اسمك في سجل آل بوخف الناهسي" : "Sign in to the Family Portal to add your name to the permanent record"}
            </p>
            <Link to="/portal" className="btn-gold mt-10 inline-flex">
              {ar ? "ادخل بوابة العائلة" : "Enter Family Portal"}
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
