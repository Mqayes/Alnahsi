import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageContext";
import { fetchPost, type BlogPost } from "@/lib/blog";
import { renderBody } from "@/lib/sanitize-html";

export const Route = createFileRoute("/blog_/$postId")({
  component: BlogPostPage,
});

/**
 * المحتوى يمر على منقّي قائمة السماح قبل العرض — على الخادم والمتصفح معاً.
 * ما يصل هنا وسوم تنسيق فقط: لا سكربتات، لا معالجات أحداث، لا روابط javascript:.
 */
function PostBody({ body }: { body: string }) {
  return <div className="prose-blog" dangerouslySetInnerHTML={{ __html: renderBody(body) }} />;
}

function BlogPostPage() {
  const { postId } = useParams({ from: "/blog_/$postId" });
  const { lang } = useLang();
  const ar = lang === "ar";
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetchPost(postId).then((res) => {
      if (cancelled) return;
      setPost(res.post);
      setError(res.error ?? "");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-6 py-32">
        <p className="font-serif-display text-navy/60">{ar ? "جارٍ التحميل…" : "Loading…"}</p>
      </section>
    );
  }

  if (!post) {
    return (
      <section
        dir={ar ? "rtl" : "ltr"}
        className="flex min-h-[60vh] items-center justify-center px-6 py-32"
      >
        <div className="max-w-md text-center">
          <h1 className="font-arabic text-2xl text-navy">
            {ar ? "التدوينة غير متاحة" : "Post unavailable"}
          </h1>
          <p className="mt-3 text-sm text-navy/70">
            {error ||
              (ar
                ? "قد تكون محذوفة، أو محفوظة لأفراد العائلة المسجّلين فقط."
                : "It may have been removed, or is visible to signed-in family members only.")}
          </p>
          <Link to="/blog" className="btn-gold mt-8 inline-flex">
            {ar ? "العودة للمدونات" : "Back to blogs"}
          </Link>
        </div>
      </section>
    );
  }

  const date = (() => {
    try {
      return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(post.created_at));
    } catch {
      return post.created_at.slice(0, 10);
    }
  })();

  return (
    <article dir={ar ? "rtl" : "ltr"} className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <Link to="/blog" className="text-sm text-navy/50 hover:text-gold">
        {ar ? "→ كل المدونات" : "← All blogs"}
      </Link>

      <h1 className="mt-6 font-arabic text-3xl leading-snug text-navy md:text-4xl">{post.title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-navy/55">
        <span>{post.author_name || (ar ? "أحد أفراد العائلة" : "A family member")}</span>
        <span aria-hidden="true" className="text-gold">
          ◆
        </span>
        <span>{date}</span>
        {post.visibility === "family" && (
          <span className="rounded-full border border-gold/40 px-2 py-0.5 text-xs text-navy/60">
            {ar ? "للعائلة فقط" : "Family only"}
          </span>
        )}
      </div>

      {post.cover_image && (
        <img
          src={post.cover_image}
          alt=""
          className="mt-8 w-full rounded-lg border border-gold/20 object-cover"
        />
      )}

      <div className="mt-8 text-lg text-navy/80">
        <PostBody body={post.body} />
      </div>
    </article>
  );
}
