import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import { useSiteContent } from "@/lib/site-content";

export function Values() {
  const { lang } = useLang();
  const sc = useSiteContent();
  const c = translations.values;
  const eyebrow = lang === "en" ? (sc["values_eyebrow_en"] || t(c.eyebrow, "en")) : (sc["values_eyebrow_ar"] || t(c.eyebrow, "ar"));
  const title = lang === "en" ? (sc["values_title_en"] || t(c.title, "en")) : (sc["values_title_ar"] || t(c.title, "ar"));
  return (
    <section className="relative bg-cream py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">{eyebrow}</div>
            <h2 className="mt-4 text-4xl md:text-5xl">{title}</h2>
            <Ornament className="mt-6" />
          </div>
        </Reveal>

        <div className="mt-20 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-5">
          {c.items.map((item, i) => {
            const nameAr = sc[`values_card_${i}_ar`] || item.ar;
            const nameEn = lang === "en" ? (sc[`values_card_${i}_name_en`] || t(item.en, "en")) : (sc[`values_card_${i}_name_ar`] || t(item.en, "ar"));
            const desc = lang === "en" ? (sc[`values_card_${i}_desc_en`] || t(item.desc, "en")) : (sc[`values_card_${i}_desc_ar`] || t(item.desc, "ar"));
            return (
              <Reveal key={i} delay={i * 100}>
                <div className="flex h-full flex-col items-center bg-cream p-10 text-center transition-colors hover:bg-parchment">
                  <span className="font-arabic text-5xl text-gold md:text-6xl">{nameAr}</span>
                  <h3 className="mt-6 font-serif-display text-lg uppercase tracking-[0.22em] text-navy">
                    {nameEn}
                  </h3>
                  <p className="mt-4 text-sm italic leading-relaxed text-foreground/70">
                    {desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
