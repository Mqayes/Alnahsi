import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchBlogFeed, excerpt, type BlogPost } from "@/lib/blog";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "مدونات العائلة — بيت آل بوخف الناهسي" },
      {
        name: "description",
        content: "مدونات أفراد العائلة — كتاباتهم وذكرياتهم وصورهم، بأقلامهم.",
      },
    ],
  }),
  component: BlogFeedPage,
});

function formatDate(iso: string, ar: boolean): string {
  try {
    return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function BlogFeedPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (isSupabaseConfigured()) {
        const {
          data: { session },
        } = await getSupabase().auth.getSession();
        if (!cancelled) setSignedIn(Boolean(session));
      }

      const res = await fetchBlogFeed();
      if (cancelled) return;
      setPosts(res.posts);
      setNeedsMigration(res.needsMigration);
      setError(res.error ?? "");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section dir={ar ? "rtl" : "ltr"} className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <header className="text-center">
        <span className="eyebrow-pill">{ar ? "بأقلامهم" : "In their words"}</span>
        <h1 className="mt-3 font-arabic text-4xl text-navy md:text-5xl">
          {ar ? "مدونات العائلة" : "Family Blogs"}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-navy/70">
          {ar
            ? "لكل فرد من العائلة مساحته الخاصة — يكتب فيها ما يشاء ويرفع صوره، فتبقى محفوظة لمن يأتي بعده."
            : "Every member of the family has their own space to write and share photographs, kept for those who come after."}
        </p>
        {signedIn && (
          <Link to="/my-blog" className="btn-gold mt-8 inline-flex">
            {ar ? "✎ اكتب في مدونتك" : "✎ Write in your blog"}
          </Link>
        )}
      </header>

      <div className="mt-14">
        {loading && (
          <p className="text-center font-serif-display text-navy/60">
            {ar ? "جارٍ التحميل…" : "Loading…"}
          </p>
        )}

        {!loading && needsMigration && (
          <div className="premium-card mx-auto max-w-xl p-6 text-center">
            <p className="font-arabic text-lg text-navy">
              {ar ? "المدونات غير مفعّلة بعد" : "Blogs are not enabled yet"}
            </p>
            <p className="mt-2 text-sm text-navy/70">
              {ar
                ? "على المالك فتح لوحة التحكم ← الإعدادات ← تطبيق ترقية «المدونات الشخصية»."
                : "The owner needs to apply the “Personal blogs” upgrade from the dashboard settings."}
            </p>
          </div>
        )}

        {!loading && !needsMigration && error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        {!loading && !needsMigration && !error && posts.length === 0 && (
          <div className="premium-card mx-auto max-w-xl p-8 text-center">
            <p className="font-arabic text-lg text-navy">
              {ar ? "لا توجد تدوينات بعد" : "No posts yet"}
            </p>
            <p className="mt-2 text-sm text-navy/70">
              {signedIn
                ? ar
                  ? "كن أول من يكتب."
                  : "Be the first to write."
                : ar
                  ? "سجّل دخولك لتقرأ ما كتبته العائلة."
                  : "Sign in to read what the family has written."}
            </p>
            {!signedIn && (
              <Link to="/portal" className="btn-gold mt-6 inline-flex">
                {ar ? "تسجيل الدخول" : "Sign in"}
              </Link>
            )}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 60}>
              <Link
                to="/blog/$postId"
                params={{ postId: post.id }}
                className="premium-card group flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-1"
              >
                {post.cover_image && (
                  <img
                    src={post.cover_image}
                    alt=""
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-arabic text-xl leading-snug text-navy group-hover:text-gold">
                    {post.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-navy/70">
                    {excerpt(post.body)}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-gold/20 pt-3 text-xs text-navy/50">
                    <span>
                      {post.author_name || (ar ? "أحد أفراد العائلة" : "A family member")}
                    </span>
                    <span>{formatDate(post.created_at, ar)}</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
