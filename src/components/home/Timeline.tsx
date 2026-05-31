import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";

export function Timeline() {
  const { lang } = useLang();
  const c = translations.timeline;
  return (
    <section className="relative bg-navy py-28 text-cream md:py-36">
      <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,#D4AF37_1px,transparent_0)] [background-size:32px_32px]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="text-center">
            <div className="eyebrow">{t(c.eyebrow, lang)}</div>
            <h2 className="mt-4 text-4xl text-cream md:text-5xl">{t(c.title, lang)}</h2>
            <Ornament className="mt-6" />
          </div>
        </Reveal>

        <div className="relative mt-20">
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent md:block" />
          <div className="grid gap-12 md:grid-cols-4 md:gap-8">
            {c.items.map((item, i) => (
              <Reveal key={item.year} delay={i * 120}>
                <div className="relative flex flex-col items-center text-center">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-gold/60 bg-navy">
                    <span className="font-serif-display text-xl text-gold">{item.year}</span>
                  </div>
                  <h3 className="mt-6 font-serif-display text-lg uppercase tracking-[0.18em] text-cream">
                    {t(item.gen, lang)}
                  </h3>
                  <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-cream/70">
                    {t(item.text, lang)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}