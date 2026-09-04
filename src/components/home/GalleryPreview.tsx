import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSiteContent } from "@/lib/site-content";
import g1 from "@/assets/gallery-1.webp";
import g2 from "@/assets/gallery-2.webp";
import g3 from "@/assets/gallery-3.webp";
import g4 from "@/assets/gallery-4.webp";

const staticPreview = [g1, g2, g4, g3];

export function GalleryPreview() {
  const { lang } = useLang();
  const sc = useSiteContent();
  const c = translations.gallery;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [preview, setPreview] = useState<string[]>(staticPreview);

  const eyebrow =
    lang === "en"
      ? sc["gallery_eyebrow_en"] || t(c.eyebrow, "en")
      : sc["gallery_eyebrow_ar"] || t(c.eyebrow, "ar");
  const title =
    lang === "en"
      ? sc["gallery_title_en"] || t(c.title, "en")
      : sc["gallery_title_ar"] || t(c.title, "ar");
  const intro =
    lang === "en"
      ? sc["gallery_intro_en"] || t(c.intro, "en")
      : sc["gallery_intro_ar"] || t(c.intro, "ar");
  const viewBtn =
    lang === "en"
      ? sc["gallery_view_en"] || t(c.view, "en")
      : sc["gallery_view_ar"] || t(c.view, "ar");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    getSupabase()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) return;
        setIsLoggedIn(true);
        getSupabase()
          .storage.from("gallery-images")
          .list("gallery", { limit: 4, sortBy: { column: "created_at", order: "desc" } })
          .then(({ data }) => {
            if (!data || data.length < 4) return;
            const urls = data
              .filter((f) => f.name !== ".emptyFolderPlaceholder")
              .slice(0, 4)
              .map(
                (f) =>
                  getSupabase().storage.from("gallery-images").getPublicUrl(`gallery/${f.name}`)
                    .data.publicUrl,
              );
            if (urls.length === 4) setPreview(urls);
          });
      });
  }, []);

  return (
    <section className="py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">{eyebrow}</div>
            <h2 className="mt-4 text-4xl md:text-5xl">{title}</h2>
            <Ornament className="mt-6" />
            <p className="mt-6 italic text-foreground/75">{intro}</p>
          </div>
        </Reveal>

        {isLoggedIn ? (
          <>
            <div className="mt-16 grid grid-cols-12 gap-4 md:gap-6">
              <Reveal direction="left" className="col-span-12 md:col-span-7 row-span-2">
                <img
                  src={preview[0]}
                  alt=""
                  loading="lazy"
                  width={1200}
                  height={800}
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="heritage-image h-full w-full object-cover"
                />
              </Reveal>
              <Reveal direction="right" delay={150} className="col-span-6 md:col-span-5">
                <img
                  src={preview[1]}
                  alt=""
                  loading="lazy"
                  width={900}
                  height={1200}
                  sizes="(min-width: 768px) 40vw, 50vw"
                  className="heritage-image h-72 w-full object-cover md:h-[18rem]"
                />
              </Reveal>
              <Reveal direction="right" delay={300} className="col-span-6 md:col-span-5">
                <img
                  src={preview[2]}
                  alt=""
                  loading="lazy"
                  width={900}
                  height={1100}
                  sizes="(min-width: 768px) 40vw, 50vw"
                  className="heritage-image h-72 w-full object-cover md:h-[18rem]"
                />
              </Reveal>
              <Reveal direction="up" delay={200} className="col-span-12">
                <img
                  src={preview[3]}
                  alt=""
                  loading="lazy"
                  width={1200}
                  height={900}
                  sizes="100vw"
                  className="heritage-image h-72 w-full object-cover md:h-[26rem]"
                />
              </Reveal>
            </div>
            <div className="mt-12 text-center">
              <Link to="/gallery" className="btn-outline-navy">
                {viewBtn}
              </Link>
            </div>
          </>
        ) : (
          <Reveal>
            <div className="mt-16 flex flex-col items-center justify-center rounded-xl border border-gold/20 bg-parchment/60 py-20 text-center">
              <span className="font-arabic text-5xl text-gold">🔒</span>
              <p className="mt-6 font-serif-display text-xl text-navy">
                {lang === "en" ? "Family members only" : "لأفراد العائلة فقط"}
              </p>
              <p className="mt-3 italic text-navy/60">
                {lang === "en"
                  ? "Sign in to view the family archive."
                  : "سجّل دخولك للاطلاع على أرشيف العائلة."}
              </p>
              <Link to="/portal" className="btn-gold mt-8 inline-flex">
                {lang === "en" ? "Sign In" : "تسجيل الدخول"}
              </Link>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
