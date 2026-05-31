import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Reveal } from "@/components/site/Reveal";
import { Ornament } from "@/components/site/Ornament";
import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & Announcements — Alnahsi" },
      {
        name: "description",
        content: "Family announcements, achievements, and important milestones from the Alnahsi family.",
      },
      { property: "og:title", content: "News & Announcements — Alnahsi" },
      { property: "og:description", content: "Family news and announcements." },
    ],
  }),
  component: NewsPage,
});

interface NewsItem {
  id: string;
  created_at: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
}

function NewsPage() {
  const { lang } = useLang();
  const c = translations.news;
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupabase()
      .from("news_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setNewsItems(data);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (lang === "en") {
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } else {
      return date.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
    }
  };

  return (
    <section className="bg-parchment text-navy pt-44 pb-32 md:pt-52">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <div className="text-center">
            <div className="eyebrow">{t(c.eyebrow, lang)}</div>
            <h1 className="mt-6 text-5xl md:text-6xl text-navy">
              {t(c.title, lang)}
            </h1>
            <Ornament className="mt-6" />
            <p className="mt-6 italic text-navy/75">{t(c.intro, lang)}</p>
          </div>
        </Reveal>

        <div className="mt-16 space-y-8">
          {loading ? (
            <Reveal>
              <div className="py-12 text-center">
                <p className="text-lg italic text-navy/60">Loading...</p>
              </div>
            </Reveal>
          ) : newsItems.length > 0 ? (
            newsItems.map((item, index) => (
              <Reveal
                key={item.id}
                delay={index * 100}
                direction={index % 2 === 0 ? "left" : "right"}
              >
                <article className="border border-gold/30 bg-cream p-8 md:p-10 hover:shadow-lg transition-shadow">
                  <div className="flex-1">
                    <time className="text-sm text-navy/60 font-body">
                      {formatDate(item.created_at)}
                    </time>
                    <h2 className="text-2xl md:text-3xl font-serif-display mb-4 mt-2">
                      {lang === "en" ? item.title_en : item.title_ar}
                    </h2>
                    <p className="text-base leading-relaxed text-navy/75">
                      {lang === "en" ? item.content_en : item.content_ar}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))
          ) : (
            <Reveal>
              <div className="py-12 text-center">
                <p className="text-lg italic text-navy/60">
                  {t(c.noNews, lang)}
                </p>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
