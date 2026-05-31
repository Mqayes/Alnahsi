import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import b1 from "@/assets/business-1.jpg";
import b2 from "@/assets/business-2.jpg";
import b3 from "@/assets/business-3.jpg";

const images = [b1, b2, b3, b1, b2, b3];

export function Businesses() {
  const { lang } = useLang();
  const c = translations.businesses;
  return (
    <section className="py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">{t(c.eyebrow, lang)}</div>
            <h2 className="mt-4 text-4xl md:text-5xl">{t(c.title, lang)}</h2>
            <Ornament className="mt-6" />
            <p className="mt-6 text-lg italic text-foreground/75">{t(c.intro, lang)}</p>
          </div>
        </Reveal>

        <div className="mt-20 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {c.cards.map((card, i) => (
            <Reveal key={card.year + i} delay={(i % 3) * 120} direction={i % 2 === 0 ? "left" : "right"}>
              <article className="heritage-card group flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[5/4] overflow-hidden">
                  <img
                    src={images[i]}
                    alt=""
                    loading="lazy"
                    width={1200}
                    height={900}
                    className="aged-photo h-full w-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 font-serif-display text-sm uppercase tracking-[0.22em] text-gold">
                    Est. {card.year}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="text-2xl">{t(card.name, lang)}</h3>
                  <p className="mt-4 flex-1 italic leading-relaxed text-foreground/75">
                    {t(card.story, lang)}
                  </p>
                  <div className="ornament mt-6 text-gold/60" aria-hidden>
                    <span className="text-xs">✦</span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}