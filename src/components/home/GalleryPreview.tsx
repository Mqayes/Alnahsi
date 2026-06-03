import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";

const staticPreview = [g1, g2, g4, g3];

export function GalleryPreview() {
  const { lang } = useLang();
  const c = translations.gallery;
  const [preview, setPreview] = useState<string[]>(staticPreview);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    getSupabase()
      .storage.from("gallery-images")
      .list("gallery", { limit: 4, sortBy: { column: "created_at", order: "desc" } })
      .then(({ data }) => {
        if (!data || data.length < 4) return;
        const urls = data
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .slice(0, 4)
          .map((f) => getSupabase().storage.from("gallery-images").getPublicUrl(`gallery/${f.name}`).data.publicUrl);
        if (urls.length === 4) setPreview(urls);
      });
  }, []);

  return (
    <section className="py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">{t(c.eyebrow, lang)}</div>
            <h2 className="mt-4 text-4xl md:text-5xl">{t(c.title, lang)}</h2>
            <Ornament className="mt-6" />
            <p className="mt-6 italic text-foreground/75">{t(c.intro, lang)}</p>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-12 gap-4 md:gap-6">
          <Reveal direction="left" className="col-span-12 md:col-span-7 row-span-2">
            <img src={preview[0]} alt="" loading="lazy" width={1200} height={800} sizes="(min-width: 768px) 60vw, 100vw" className="heritage-image h-full w-full object-cover" />
          </Reveal>
          <Reveal direction="right" delay={150} className="col-span-6 md:col-span-5">
            <img src={preview[1]} alt="" loading="lazy" width={900} height={1200} sizes="(min-width: 768px) 40vw, 50vw" className="heritage-image h-72 w-full object-cover md:h-[18rem]" />
          </Reveal>
          <Reveal direction="right" delay={300} className="col-span-6 md:col-span-5">
            <img src={preview[2]} alt="" loading="lazy" width={900} height={1100} sizes="(min-width: 768px) 40vw, 50vw" className="heritage-image h-72 w-full object-cover md:h-[18rem]" />
          </Reveal>
          <Reveal direction="up" delay={200} className="col-span-12">
            <img src={preview[3]} alt="" loading="lazy" width={1200} height={900} sizes="100vw" className="heritage-image h-72 w-full object-cover md:h-[26rem]" />
          </Reveal>
        </div>

        <div className="mt-12 text-center">
          <Link to="/gallery" className="btn-ghost-gold">
            {t(c.view, lang)}
          </Link>
        </div>
      </div>
    </section>
  );
}