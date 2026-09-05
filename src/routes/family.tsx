import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getSupabase,
  isSupabaseConfigured,
  type FamilyMember,
  type NewsPost,
} from "@/lib/supabase";
import { useLang } from "@/lib/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyProfile } from "@/components/member/MyProfile";
import { MyBranch } from "@/components/member/MyBranch";
import { MyPosts } from "@/components/member/MyPosts";
import { Ornament } from "@/components/site/Ornament";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [{ title: "Family Portal — Al Bukhuf Alnahsi" }, { name: "robots", content: "noindex" }],
  }),
  component: FamilyPortal,
});

function FamilyPortal() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      void navigate({ to: "/portal" });
      return;
    }

    async function init(session: import("@supabase/supabase-js").Session | null) {
      if (!session) {
        void navigate({ to: "/portal" });
        return;
      }
      const { data: profile } = await getSupabase()
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (["owner", "admin", "moderator"].includes(profile?.role ?? "")) {
        void navigate({ to: "/admin" });
        return;
      }
      setUserName(profile?.full_name || (lang === "en" ? "Family member" : "عضو العائلة"));
      setLoading(false);
    }

    // First check existing session
    getSupabase()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (session) {
          void init(session);
          return;
        }
        // No session yet — wait for token from URL (invite/magic link)
        const {
          data: { subscription },
        } = getSupabase().auth.onAuthStateChange((_event, session) => {
          subscription.unsubscribe();
          void init(session);
        });
        // Timeout: if no auth event in 3s, redirect to portal
        const t = setTimeout(() => {
          subscription.unsubscribe();
          void navigate({ to: "/portal" });
        }, 3000);
        return () => {
          clearTimeout(t);
          subscription.unsubscribe();
        };
      });
  }, [navigate]);

  const signOut = async () => {
    await getSupabase().auth.signOut();
    void navigate({ to: "/portal" });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-serif-display text-lg text-navy/50">
          {lang === "en" ? "Loading..." : "جاري التحميل..."}
        </p>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-parchment pb-24 pt-36">
      <div className="mx-auto max-w-6xl px-6">
        {/* Welcome header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-gold/20 pb-8">
          <div>
            <p className="eyebrow text-gold">{lang === "en" ? "Welcome back" : "مرحباً بعودتك"}</p>
            <h1 className="mt-2 font-serif-display text-3xl text-navy md:text-4xl">{userName}</h1>
          </div>
          <div className="flex gap-3">
            <Link
              to="/tree"
              className="border border-gold/40 bg-gold/10 px-4 py-1.5 font-cinzel text-xs uppercase tracking-[0.18em] text-navy hover:bg-gold/20 transition-colors"
            >
              {lang === "en" ? "Family tree" : "شجرة العائلة"}
            </Link>
            <Link
              to="/"
              className="border border-gold/40 px-4 py-1.5 font-cinzel text-xs uppercase tracking-[0.18em] text-navy/60 hover:text-navy transition-colors"
            >
              {lang === "en" ? "← Home" : "الرئيسية →"}
            </Link>
            <button
              onClick={signOut}
              className="border border-navy/30 px-4 py-1.5 font-cinzel text-xs uppercase tracking-[0.18em] text-navy/60 hover:border-navy hover:text-navy transition-colors"
            >
              {lang === "en" ? "Sign Out" : "تسجيل الخروج"}
            </button>
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="h-auto flex-wrap gap-1 bg-navy/5 p-1">
            <TabsTrigger value="profile">{lang === "en" ? "My profile" : "ملفي"}</TabsTrigger>
            <TabsTrigger value="branch">
              {lang === "en" ? "My branch" : "فرعي في الشجرة"}
            </TabsTrigger>
            <TabsTrigger value="posts">{lang === "en" ? "My posts" : "مشاركاتي"}</TabsTrigger>
            <TabsTrigger value="news">{lang === "en" ? "News" : "الأخبار"}</TabsTrigger>
            <TabsTrigger value="gallery">{lang === "en" ? "Gallery" : "المعرض"}</TabsTrigger>
            <TabsTrigger value="directory">
              {lang === "en" ? "Family Directory" : "دليل العائلة"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-8">
            <MyProfile ar={lang !== "en"} />
          </TabsContent>
          <TabsContent value="branch" className="mt-8">
            <MyBranch ar={lang !== "en"} />
          </TabsContent>
          <TabsContent value="posts" className="mt-8">
            <MyPosts ar={lang !== "en"} />
          </TabsContent>
          <TabsContent value="news" className="mt-8">
            <FamilyNewsTab lang={lang} />
          </TabsContent>
          <TabsContent value="gallery" className="mt-8">
            <FamilyGalleryTab lang={lang} />
          </TabsContent>
          <TabsContent value="directory" className="mt-8">
            <FamilyDirectoryTab lang={lang} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

// ─── News Tab ──────────────────────────────────────────────────────────────

function FamilyNewsTab({ lang }: { lang: string }) {
  const [posts, setPosts] = useState<(NewsPost & { is_private?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupabase()
      .from("news_posts")
      .select(
        "id, title_en, title_ar, content_en, content_ar, cover_image, created_at, is_private, status",
      )
      .or("status.eq.published,status.is.null")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPosts((data ?? []) as (NewsPost & { is_private?: boolean })[]);
        setLoading(false);
      });
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === "en" ? "en-US" : "ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) return <LoadingState lang={lang} />;

  if (posts.length === 0) {
    return <EmptyState lang={lang} en="No announcements yet." ar="لا توجد إعلانات بعد." />;
  }

  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <article
          key={post.id}
          className="border border-gold/20 bg-cream hover:shadow-md transition-shadow"
        >
          {post.cover_image && (
            <img src={post.cover_image} alt="" className="h-56 w-full object-cover" />
          )}
          <div className="p-8">
            <div className="mb-3 flex items-center gap-3">
              <time className="text-sm text-navy/50">{formatDate(post.created_at)}</time>
              {post.is_private && (
                <span className="rounded bg-gold/20 px-2 py-0.5 font-cinzel text-xs uppercase tracking-wider text-gold">
                  {lang === "en" ? "Family Only" : "للعائلة فقط"}
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl">
              {lang === "en" ? post.title_en : post.title_ar}
            </h2>
            <Ornament className="my-5 justify-start" />
            <p className="leading-relaxed text-navy/75">
              {lang === "en" ? post.content_en : post.content_ar}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

// ─── Gallery Tab ──────────────────────────────────────────────────────────

function FamilyGalleryTab({ lang }: { lang: string }) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    getSupabase()
      .storage.from("gallery-images")
      .list("gallery", { sortBy: { column: "created_at", order: "desc" } })
      .then(({ data }) => {
        const urls = (data ?? [])
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map(
            (f) =>
              getSupabase().storage.from("gallery-images").getPublicUrl(`gallery/${f.name}`).data
                .publicUrl,
          );
        setImages(urls);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingState lang={lang} />;

  if (images.length === 0) {
    return (
      <EmptyState lang={lang} en="No photos in the archive yet." ar="لا توجد صور في الأرشيف بعد." />
    );
  }

  return (
    <>
      <p className="mb-6 text-sm italic text-navy/50">
        {lang === "en"
          ? `${images.length} photos in the family archive`
          : `${images.length} صورة في أرشيف العائلة`}
      </p>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {images.map((url, i) => (
          <button
            key={i}
            className="block w-full overflow-hidden break-inside-avoid focus:outline-none"
            onClick={() => setLightbox(url)}
          >
            <img
              src={url}
              alt=""
              loading="lazy"
              className="heritage-image w-full transition-transform duration-700 hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/95 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-h-[90vh] max-w-full object-contain" />
          <button
            className="absolute right-6 top-6 font-cinzel text-cream/60 hover:text-cream text-2xl"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

// ─── Directory Tab ─────────────────────────────────────────────────────────

function FamilyDirectoryTab({ lang }: { lang: string }) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getSupabase()
      .from("family_members")
      .select("id, full_name_en, full_name_ar, relation, birth_year, death_year, photo_url")
      .order("full_name_en", { ascending: true })
      .then(({ data }) => {
        setMembers((data ?? []) as FamilyMember[]);
        setLoading(false);
      });
  }, []);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.full_name_en?.toLowerCase().includes(q) ||
      m.full_name_ar?.includes(search) ||
      m.relation?.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingState lang={lang} />;

  if (members.length === 0) {
    return (
      <EmptyState
        lang={lang}
        en="No family members registered yet."
        ar="لم يتم تسجيل أفراد العائلة بعد."
      />
    );
  }

  return (
    <>
      <input
        type="text"
        placeholder={lang === "en" ? "Search by name or relation…" : "ابحث بالاسم أو القرابة…"}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-8 w-full max-w-sm border border-gold/30 bg-transparent px-4 py-2.5 text-navy outline-none focus:border-gold placeholder:text-navy/40"
        dir={lang === "ar" ? "rtl" : "ltr"}
      />

      {filtered.length === 0 ? (
        <p className="italic text-navy/50">{lang === "en" ? "No results." : "لا نتائج."}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="flex items-start gap-4 border border-gold/20 bg-cream p-5"
            >
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full object-cover border border-gold/20"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-navy/5">
                  <span className="font-serif-display text-xl text-gold">
                    {(member.full_name_en || member.full_name_ar || "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-serif-display text-lg leading-tight text-navy">
                  {member.full_name_en}
                </p>
                {member.full_name_ar && (
                  <p className="font-arabic text-sm text-navy/60">{member.full_name_ar}</p>
                )}
                {member.relation && (
                  <p className="mt-1 text-xs uppercase tracking-wider text-gold">
                    {member.relation}
                  </p>
                )}
                {(member.birth_year || member.death_year) && (
                  <p className="mt-1 text-xs text-navy/40">
                    {member.birth_year ?? ""}
                    {member.death_year ? ` – ${member.death_year}` : ""}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-8 text-center text-xs text-navy/40">
        {filtered.length} {lang === "en" ? "members" : "عضو"}
        {search ? (lang === "en" ? " found" : " وجد") : ""}
      </p>
    </>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function LoadingState({ lang }: { lang: string }) {
  return (
    <p className="py-16 text-center font-serif-display text-lg italic text-navy/40">
      {lang === "en" ? "Loading..." : "جاري التحميل..."}
    </p>
  );
}

function EmptyState({ lang, en, ar }: { lang: string; en: string; ar: string }) {
  return (
    <div className="py-20 text-center">
      <Ornament className="mb-6" />
      <p className="font-serif-display text-lg italic text-navy/50">{lang === "en" ? en : ar}</p>
    </div>
  );
}
