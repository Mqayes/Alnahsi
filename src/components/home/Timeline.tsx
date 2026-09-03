import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { useSiteContent } from "@/lib/site-content";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";

export function Timeline() {
  const { lang } = useLang();
  const sc = useSiteContent();
  const c = translations.timeline;

  const title = lang === "en"
    ? (sc["timeline_title_en"] || t(c.title, "en"))
    : (sc["timeline_title_ar"] || t(c.title, "ar"));

  return (
    <section className="relative bg-cream py-28 text-navy md:py-36">
      <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,#D4AF37_1px,transparent_0)] [background-size:32px_32px]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="text-center">
            <div className="eyebrow">{t(c.eyebrow, lang)}</div>
            <h2 className="mt-4 text-4xl text-navy md:text-5xl">{title}</h2>
            <Ornament className="mt-6" />
          </div>
        </Reveal>

        <div className="relative mt-20">
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent md:block" />
          <div className="grid gap-12 md:grid-cols-4 md:gap-8">
            {c.items.map((item, i) => {
              const year = sc[`timeline_${i}_year`] || item.year;
              const gen  = lang === "en"
                ? (sc[`timeline_${i}_gen_en`]  || t(item.gen,  "en"))
                : (sc[`timeline_${i}_gen_ar`]  || t(item.gen,  "ar"));
              const text = lang === "en"
                ? (sc[`timeline_${i}_text_en`] || t(item.text, "en"))
                : (sc[`timeline_${i}_text_ar`] || t(item.text, "ar"));
              return (
                <Reveal key={i} delay={i * 120}>
                  <div className="relative flex flex-col items-center text-center">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-gold/50 bg-white shadow-[0_8px_30px_rgba(201,162,39,0.18)]">
                      <span className="font-serif-display text-xl text-gold">{year}</span>
                    </div>
                    <h3 className="mt-6 font-serif-display text-lg uppercase tracking-[0.18em] text-navy">{gen}</h3>
                    <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-navy/65">{text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}