import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase, isSupabaseConfigured, withTimeout } from "@/lib/supabase";
import { RichEditor } from "@/components/blog/RichEditor";
import { GalleryContribTab } from "@/components/blog/GalleryContribTab";
import { NewsContribTab } from "@/components/blog/NewsContribTab";
import {
  deletePost,
  excerpt,
  fetchPostsByAuthor,
  savePost,
  uploadBlogImage,
  verifyImageUrl,
  type BlogDraft,
  type BlogPost,
} from "@/lib/blog";

export const Route = createFileRoute("/my-blog")({
  head: () => ({ meta: [{ title: "مساحتي — بيت آل بوخف الناهسي" }] }),
  component: MyBlogPage,
});

type Me = { id: string; name: string | null };
type Auth = { status: "loading" } | { status: "denied" } | { status: "ok"; me: Me };

const EMPTY: BlogDraft = {
  title: "",
  body: "",
  cover_image: null,
  status: "published",
  visibility: "family",
};

function MyBlogPage() {
  const [auth, setAuth] = useState<Auth>({ status: "loading" });
  const [section, setSection] = useState<"blog" | "gallery" | "news">("blog");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [draft, setDraft] = useState<BlogDraft>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const inlineInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!isSupabaseConfigured()) {
        setAuth({ status: "denied" });
        return;
      }
      const {
        data: { session },
      } = await withTimeout(getSupabase().auth.getSession(), 10_000, "التحقق من الجلسة");
      if (cancelled) return;
      if (!session) {
        setAuth({ status: "denied" });
        return;
      }

      const { data: profile } = await getSupabase()
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;
      setAuth({
        status: "ok",
        me: {
          id: session.user.id,
          name: (profile as { full_name?: string } | null)?.full_name ?? session.user.email ?? null,
        },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(async (authorId: string) => {
    const res = await fetchPostsByAuthor(authorId);
    setPosts(res.posts);
    setNeedsMigration(res.needsMigration);
    if (res.error) setError(res.error);
  }, []);

  useEffect(() => {
    if (auth.status === "ok") void reload(auth.me.id);
  }, [auth, reload]);

  if (auth.status === "loading") {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-6 py-32">
        <p className="font-serif-display text-navy/60">جارٍ التحقق…</p>
      </section>
    );
  }

  if (auth.status === "denied") {
    return (
      <section dir="rtl" className="flex min-h-[60vh] items-center justify-center px-6 py-32">
        <div className="max-w-md text-center">
          <h1 className="font-arabic text-3xl text-navy">مساحتك في الموقع</h1>
          <p className="mt-4 text-navy/70">
            سجّل دخولك لتكتب في مدونتك، وتنشر أخبارك، وتضيف صوراً لسجل العائلة.
          </p>
          <Link to="/portal" className="btn-gold mt-8 inline-flex">
            تسجيل الدخول
          </Link>
        </div>
      </section>
    );
  }

  const me = auth.me;

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  };

  const handleUpload = async (file: File, asCover: boolean) => {
    setBusy(true);
    setError("");
    flash("جارٍ ضغط الصورة ورفعها…");

    const res = await uploadBlogImage(file, me.id);

    if (res.error || !res.url) {
      setBusy(false);
      setError(res.error ?? "تعذّر رفع الصورة.");
      return;
    }

    // لا نكتفي بنجاح الرفع: نتأكد أن الرابط يفتح فعلاً قبل إدراجه.
    const reachable = await verifyImageUrl(res.url);
    setBusy(false);

    if (!reachable) {
      setError(
        "رُفعت الصورة لكن رابطها لا يفتح — مخزن الصور غير معلن للعموم. " +
          "على المالك تطبيق ترقية «المدونات الشخصية» من لوحة التحكم.",
      );
      return;
    }

    const saved = res.savedBytes ?? 0;
    const savedNote = saved > 100_000 ? ` (وُفّر ${Math.round(saved / 1024)} كيلوبايت بالضغط)` : "";

    if (asCover) {
      setDraft((d) => ({ ...d, cover_image: res.url! }));
      flash(`رُفعت صورة الغلاف${savedNote}.`);
      return;
    }

    setDraft((d) => ({ ...d, body: `${d.body}<img src="${res.url}" alt="" />` }));
    flash(`أُدرجت الصورة${savedNote}.`);
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      setError("اكتب عنواناً للتدوينة.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await savePost(draft, me);
    setBusy(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    setDraft(EMPTY);
    setEditing(false);
    flash("حُفظت التدوينة.");
    void reload(me.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("حذف هذه التدوينة نهائياً؟")) return;
    setBusy(true);
    const err = await deletePost(id);
    setBusy(false);
    if (err) setError(err);
    else {
      flash("حُذفت التدوينة.");
      void reload(me.id);
    }
  };

  return (
    <section dir="rtl" className="mx-auto max-w-4xl px-6 pb-24 pt-32">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow-pill">مساحتي</span>
          <h1 className="mt-2 font-arabic text-3xl text-navy md:text-4xl">
            {me.name ?? "مساحتي في الموقع"}
          </h1>
        </div>
        <Link
          to="/blog"
          className="rounded-lg border border-gold/40 bg-white px-4 py-2 text-sm text-navy hover:bg-parchment"
        >
          مدونات العائلة
        </Link>
      </header>

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-gold/20 pb-3">
        {(
          [
            { id: "blog", label: "✎ مدونتي" },
            { id: "news", label: "📰 أخباري" },
            { id: "gallery", label: "🖼 صور العائلة" },
          ] as const
        ).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              section === s.id
                ? "border-gold bg-gold font-semibold text-navy"
                : "border-gold/30 bg-white text-navy/70 hover:bg-parchment"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {needsMigration && (
        <div className="premium-card mt-8 border-amber-400 p-5">
          <p className="font-arabic text-navy">المدونات غير مفعّلة بعد.</p>
          <p className="mt-2 text-sm text-navy/70">
            على المالك تطبيق ترقية «المدونات الشخصية» من لوحة التحكم ← الإعدادات.
          </p>
        </div>
      )}

      {notice && (
        <p className="mt-6 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm text-navy">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {section === "gallery" && (
        <div className="mt-8">
          <GalleryContribTab me={me} onNotice={flash} onError={setError} />
        </div>
      )}

      {section === "news" && (
        <div className="mt-8">
          <NewsContribTab me={me} onNotice={flash} onError={setError} />
        </div>
      )}

      {section === "blog" && !editing && (
        <div className="mt-8">
          <Button
            onClick={() => {
              setDraft(EMPTY);
              setEditing(true);
            }}
          >
            ✎ تدوينة جديدة
          </Button>
        </div>
      )}

      {section === "blog" && editing && (
        <div className="premium-card mt-8 space-y-5 p-6">
          <div>
            <Label htmlFor="blog-title">العنوان</Label>
            <Input
              id="blog-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="عنوان التدوينة"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="blog-body">النص</Label>
            <div className="mt-1.5">
              <RichEditor
                value={draft.body}
                onChange={(html) => setDraft((d) => ({ ...d, body: html }))}
                onRequestImage={() => inlineInputRef.current?.click()}
                placeholder="اكتب هنا… استخدم شريط الأدوات للعناوين والقوائم والصور."
              />
            </div>
            <input
              ref={inlineInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f, false);
                e.target.value = "";
              }}
            />
            <p className="mt-1.5 text-xs text-navy/50">
              الصور تُضغط تلقائياً في متصفحك قبل الرفع، فتفتح الصفحة أسرع لمن يقرؤها.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-lg border border-gold/40 bg-white px-4 py-2 text-sm text-navy hover:bg-parchment">
              {draft.cover_image ? "تغيير صورة الغلاف" : "صورة الغلاف"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f, true);
                  e.target.value = "";
                }}
              />
            </label>

            {draft.cover_image && (
              <div className="flex items-center gap-2">
                <img
                  src={draft.cover_image}
                  alt="صورة الغلاف"
                  className="h-12 w-20 rounded border border-gold/30 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, cover_image: null }))}
                  className="text-xs text-destructive hover:underline"
                >
                  إزالة
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="blog-visibility">من يراها</Label>
              <select
                id="blog-visibility"
                value={draft.visibility}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, visibility: e.target.value as BlogDraft["visibility"] }))
                }
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="family">أفراد العائلة المسجّلون</option>
                <option value="public">الجميع (عامة)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="blog-status">الحالة</Label>
              <select
                id="blog-status"
                value={draft.status}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, status: e.target.value as BlogDraft["status"] }))
                }
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="published">منشورة</option>
                <option value="draft">مسودة (أنا فقط)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => void handleSave()} disabled={busy}>
              {busy ? "جارٍ الحفظ…" : draft.id ? "حفظ التعديل" : "نشر"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false);
                setDraft(EMPTY);
              }}
              disabled={busy}
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {section === "blog" && (
        <div className="mt-12 space-y-4">
          <h2 className="font-arabic text-xl text-navy">تدويناتي ({posts.length})</h2>

          {posts.length === 0 && !needsMigration && (
            <p className="text-sm text-navy/60">لم تكتب شيئاً بعد.</p>
          )}

          {posts.map((post) => (
            <div key={post.id} className="premium-card flex flex-wrap items-start gap-4 p-5">
              {post.cover_image && (
                <img
                  src={post.cover_image}
                  alt=""
                  className="h-20 w-28 shrink-0 rounded border border-gold/20 object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-arabic text-lg text-navy">{post.title}</h3>
                  {post.status === "draft" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      مسودة
                    </span>
                  )}
                  {post.visibility === "public" && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                      عامة
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-navy/65">{excerpt(post.body, 120)}</p>
                <div className="mt-3 flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft({
                        id: post.id,
                        title: post.title,
                        body: post.body,
                        cover_image: post.cover_image,
                        status: post.status,
                        visibility: post.visibility,
                      });
                      setEditing(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-navy hover:text-gold"
                  >
                    تعديل
                  </button>
                  <Link
                    to="/blog/$postId"
                    params={{ postId: post.id }}
                    className="text-navy hover:text-gold"
                  >
                    عرض
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(post.id)}
                    className="text-destructive hover:underline"
                    disabled={busy}
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
