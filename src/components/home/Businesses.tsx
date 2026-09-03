import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import { useSiteContent } from "@/lib/site-content";
import { HeritagePlate } from "@/components/site/HeritagePlate";

const MOTIFS = ["mountain", "camel", "palm", "wheat", "wheat", "gear"] as const;
const AR_YEARS = ["٥٧١", "١٨٣٤", "١٩٠٢", "١٩٤٠", "١٩٨٠", "٢٠٠١"];

export function Businesses() {
  const { lang } = useLang();
  const sc = useSiteContent();
  const c = translations.businesses;

  const title = lang === "en" ? (sc["legacy_title_en"] || t(c.title, "en")) : (sc["legacy_title_ar"] || t(c.title, "ar"));
  const intro = lang === "en" ? (sc["legacy_intro_en"] || t(c.intro, "en")) : (sc["legacy_intro_ar"] || t(c.intro, "ar"));

  return (
    <section className="py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">{t(c.eyebrow, lang)}</div>
            <h2 className="mt-4 text-4xl md:text-5xl">{title}</h2>
            <Ornament className="mt-6" />
            <p className="mt-6 text-lg italic text-foreground/75">{intro}</p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-2 md:gap-7 lg:grid-cols-3">
          {c.cards.map((card, i) => {
            const year  = sc[`legacy_card_${i}_year`]     || card.year;
            const name  = lang === "en"
              ? (sc[`legacy_card_${i}_name_en`]  || t(card.name,  "en"))
              : (sc[`legacy_card_${i}_name_ar`]  || t(card.name,  "ar"));
            const story = lang === "en"
              ? (sc[`legacy_card_${i}_story_en`] || t(card.story, "en"))
              : (sc[`legacy_card_${i}_story_ar`] || t(card.story, "ar"));
            return (
              <article key={i} className="premium-card group flex h-full flex-col">
                <HeritagePlate year={lang === "ar" ? AR_YEARS[i] : year} motif={MOTIFS[i]} className="aspect-[5/4]" />
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="text-2xl">{name}</h3>
                  <p className="mt-4 flex-1 italic leading-relaxed text-foreground/75">{story}</p>
                  <div className="ornament mt-6 text-gold/60" aria-hidden>
                    <span className="text-xs">✦</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}