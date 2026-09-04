import { MembersManager } from "@/components/admin/MembersManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { Dashboard } from "@/components/admin/Dashboard";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { EventsTab } from "@/components/admin/EventsTab";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { inviteByMagicLink } from "@/lib/api/invite-client";
import { removeFamilyMember } from "@/lib/api/remove-member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getSupabase,
  isSupabaseConfigured,
  withTimeout,
  type FamilyMember,
  type GalleryImage,
  type JoinRequest,
  type NewsPost,
  type Profile,
} from "@/lib/supabase";
import { upsertSiteContent, deleteSiteContent, useSiteContent } from "@/lib/site-content";
import heroDefault from "@/assets/hero-heritage.webp";
import originDefault from "@/assets/story-album.webp";
import b1Default from "@/assets/business-1.webp";
import b2Default from "@/assets/business-2.webp";
import b3Default from "@/assets/business-3.webp";
import patriarchDefault from "@/assets/patriarch.webp";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Al Bukhuf Alnahsi Family Portal" }],
  }),
  component: AdminPage,
});

type AuthState =
  | { status: "loading" }
  | { status: "denied"; message: string }
  | { status: "authorized"; profile: Profile };

function AdminPage() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [tab, setTab] = useState<string>("dashboard");

  useEffect(() => {
    let cancelled = false;

    async function verifyAdmin() {
      if (!isSupabaseConfigured()) {
        setAuth({
          status: "denied",
          message:
            "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart the dev server.",
        });
        return;
      }

      try {
        const supabase = getSupabase();

        const {
          data: { session },
          error: sessionError,
        } = await withTimeout(supabase.auth.getSession(), 10_000, "Session check");

        if (cancelled) return;

        if (sessionError || !session) {
          setAuth({
            status: "denied",
            message: "سجّل دخولك أولاً للوصول إلى لوحة التحكم.",
          });
          return;
        }

        const { data: profile, error: profileError } = await withTimeout(
          supabase
            .from("profiles")
            .select("id, role, email, full_name")
            .eq("id", session.user.id)
            .maybeSingle(),
          10_000,
          "Profile check",
        );

        if (cancelled) return;

        if (profileError) {
          setAuth({
            status: "denied",
            message: `Could not verify your profile: ${profileError.message}`,
          });
          return;
        }

        // أعمدة اختيارية قد لا تكون موجودة قبل الترقية
        let extra: { status?: string; permissions?: string[] } = {};
        try {
          const { data: ex } = await supabase
            .from("profiles")
            .select("status, permissions")
            .eq("id", session.user.id)
            .maybeSingle();
          if (ex) extra = ex as typeof extra;
        } catch {
          /* pre-migration */
        }
        if (extra.status === "suspended") {
          setAuth({ status: "denied", message: "تم إيقاف هذا الحساب. تواصل مع إدارة العائلة." });
          return;
        }
        if (profile) Object.assign(profile, extra);
        if (!profile || !["owner", "admin", "moderator"].includes(profile.role)) {
          setAuth({
            status: "denied",
            message: "حسابك لا يملك صلاحية الدخول إلى لوحة التحكم.",
          });
          return;
        }

        setAuth({ status: "authorized", profile: profile as Profile });
      } catch (err) {
        if (cancelled) return;
        setAuth({
          status: "denied",
          message:
            err instanceof Error
              ? err.message
              : "Could not verify admin access. Please try signing in again.",
        });
      }
    }

    void verifyAdmin();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      await getSupabase().auth.signOut();
    }
    window.location.href = "/portal";
  };

  if (auth.status === "loading") {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-6 py-32">
        <p className="font-serif-display text-lg text-navy/70">جارٍ التحقق من الصلاحية…</p>
      </section>
    );
  }

  if (auth.status === "denied") {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-6 py-32">
        <div className="max-w-md text-center">
          <h1 className="font-serif-display text-3xl text-navy">غير مصرّح</h1>
          <p className="mt-4 text-navy/70">{auth.message}</p>
          <Link to="/portal" className="btn-gold mt-8 inline-flex">
            الذهاب لتسجيل الدخول
          </Link>
        </div>
      </section>
    );
  }

  const NAV: { id: string; label: string; icon: string; perm?: string }[] = [
    { id: "dashboard", label: "لوحة القيادة", icon: "▦" },
    { id: "members", label: "الأعضاء والشجرة", icon: "🌳", perm: "manage_members" },
    { id: "requests", label: "طلبات الانضمام", icon: "✉", perm: "approve_requests" },
    { id: "users", label: "الحسابات والصلاحيات", icon: "👥" },
    { id: "events", label: "مناسبات العائلة", icon: "🎉", perm: "manage_news" },
    { id: "news", label: "الأخبار", icon: "📰", perm: "manage_news" },
    { id: "gallery", label: "الأرشيف والصور", icon: "🖼", perm: "manage_gallery" },
    { id: "content", label: "محتوى الرئيسية", icon: "✎", perm: "manage_content" },
    { id: "story", label: "صفحة قصتنا", icon: "📜", perm: "manage_content" },
    { id: "settings", label: "الإعدادات", icon: "⚙" },
  ];
  const role = auth.profile.role;
  const perms = (auth.profile as { permissions?: string[] }).permissions ?? [];
  const allowed = (n: (typeof NAV)[number]) =>
    role === "owner" || role === "admin" || !n.perm || perms.includes(n.perm);
  const visible = NAV.filter((n) => (n.id === "users" ? role !== "moderator" : allowed(n)));

  return (
    <section dir="rtl" className="mx-auto max-w-7xl px-4 pb-20 pt-28 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow-pill">لوحة التحكم</span>
          <h1 className="mt-2 font-arabic text-3xl text-navy md:text-4xl">بيت آل بوخف الناهسي</h1>
          <p className="mt-1 text-sm text-navy/60">
            مسجّل الدخول:{" "}
            <b className="text-navy">{auth.profile.full_name ?? auth.profile.email}</b> ·{" "}
            <span className="text-gold">
              {role === "owner" ? "المالك" : role === "admin" ? "أدمن" : "مشرف"}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/"
            className="rounded-lg border border-gold/40 bg-white px-4 py-2 text-sm text-navy hover:bg-parchment"
          >
            عرض الموقع
          </Link>
          <Button variant="outline" onClick={handleSignOut}>
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
        {visible.map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${tab === n.id ? "border-gold bg-gold text-navy" : "border-gold/30 bg-white text-navy/70"}`}
          >
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="hidden md:block">
          <nav className="premium-card sticky top-24 p-2">
            {visible.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-sm transition ${tab === n.id ? "bg-gold text-navy font-semibold" : "text-navy/70 hover:bg-parchment"}`}
              >
                <span className="w-5 text-center">{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          {tab === "dashboard" && <Dashboard go={setTab} isOwner={role === "owner"} />}
          {tab === "members" && <MembersManager />}
          {tab === "requests" && <JoinRequestsTab />}
          {tab === "users" && <UsersManager me={{ id: auth.profile.id, role }} />}
          {tab === "events" && <EventsTab />}
          {tab === "news" && <NewsTab />}
          {tab === "gallery" && <GalleryTab />}
          {tab === "content" && <HomeContentTab />}
          {tab === "story" && <OurStoryTab />}
          {tab === "settings" && <SettingsTab />}
        </main>
      </div>
    </section>
  );
}

function JoinRequestsTab() {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await getSupabase()
      .from("join_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setRequests([]);
    } else {
      setRequests((data ?? []) as JoinRequest[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setActionId(id);
    setError("");

    const request = requests.find((r) => r.id === id);

    if (status === "approved" && request) {
      const r = request as JoinRequest & {
        first_name?: string | null;
        full_name_ar?: string | null;
        parent_id?: string | null;
        gender?: string | null;
        birth_year?: number | null;
        death_year?: number | null;
        is_deceased?: boolean | null;
        city?: string | null;
        phone?: string | null;
        occupation?: string | null;
      };
      let generation: number | null = 1;
      if (r.parent_id) {
        const { data: par } = await getSupabase()
          .from("family_members")
          .select("generation")
          .eq("id", r.parent_id)
          .maybeSingle();
        generation = par?.generation ? par.generation + 1 : null;
      }
      const { error: memberError } = await getSupabase()
        .from("family_members")
        .insert({
          full_name_en: r.full_name_en,
          full_name_ar: r.full_name_ar ?? r.full_name_en,
          first_name: r.first_name ?? null,
          parent_id: r.parent_id ?? null,
          generation,
          gender: r.gender ?? null,
          birth_year: r.birth_year ?? null,
          death_year: r.death_year ?? null,
          is_deceased: r.is_deceased ?? false,
          city: r.city ?? null,
          phone: r.phone ?? null,
          occupation: r.occupation ?? null,
          email: r.email,
          relation: r.message?.split("\n")[0] ?? null,
        });

      if (memberError) {
        setError(`تعذّر إضافة الفرد للشجرة: ${memberError.message}`);
        setActionId(null);
        return;
      }

      if (!r.is_deceased && r.email) {
        const invite = await inviteByMagicLink(r.email, r.full_name_en);
        if (!invite.success) {
          setError(`تمت الإضافة لكن تعذّر إرسال الدعوة: ${invite.error}`);
        }
      }
    }

    const { error: updateError } = await getSupabase()
      .from("join_requests")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setRequests((prev) => prev.filter((item) => item.id !== id));
    }

    setActionId(null);
  };

  return (
    <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
      <h2 className="font-serif-display text-2xl text-navy">Pending join requests</h2>

      {loading && <p className="mt-4 text-navy/60">Loading requests...</p>}
      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && requests.length === 0 && (
        <p className="mt-4 text-navy/60">No pending requests.</p>
      )}

      <ul className="mt-6 space-y-4">
        {requests.map((request) => (
          <li key={request.id} className="rounded-lg border border-gold/15 bg-white/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium text-navy">{request.full_name_en}</p>
                <p className="text-sm text-navy/70">{request.email}</p>
                {request.message && (
                  <p className="mt-2 text-sm italic text-navy/60">{request.message}</p>
                )}
                <p className="mt-2 text-xs text-navy/50">
                  {new Date(request.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={actionId === request.id}
                  onClick={() => void updateStatus(request.id, "approved")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionId === request.id}
                  onClick={() => void updateStatus(request.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewsTab() {
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentAr, setContentAr] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    const { data } = await getSupabase()
      .from("news_posts")
      .select("id, title_en, title_ar, content_en, content_ar, created_at, is_private")
      .order("created_at", { ascending: false });
    setPosts((data ?? []) as NewsPost[]);
    setPostsLoading(false);
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploadLoading(true);
    const ext = file.name.split(".").pop();
    const path = `news/${Date.now()}.${ext}`;
    const { error: uploadErr } = await getSupabase()
      .storage.from("news-images")
      .upload(path, file, { upsert: true });
    if (uploadErr) {
      setUploadError(`Upload failed: ${uploadErr.message}`);
      setUploadLoading(false);
      return;
    }
    const { data } = getSupabase().storage.from("news-images").getPublicUrl(path);
    setCoverImage(data.publicUrl);
    setImagePreview(data.publicUrl);
    setUploadLoading(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const { error: insertError } = await getSupabase()
      .from("news_posts")
      .insert({
        title_en: titleEn.trim(),
        title_ar: titleAr.trim(),
        content_en: contentEn.trim(),
        content_ar: contentAr.trim(),
        cover_image: coverImage || null,
        is_private: isPrivate,
      });
    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage("News post published.");
      setTitleEn("");
      setTitleAr("");
      setContentEn("");
      setContentAr("");
      setCoverImage("");
      setImagePreview("");
      setIsPrivate(false);
      void loadPosts();
    }
    setLoading(false);
  };

  const deletePost = async (id: string) => {
    setDeletingId(id);
    const { error: deleteError } = await getSupabase().from("news_posts").delete().eq("id", id);
    if (!deleteError) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } else {
      setError("تعذّر الحذف: " + deleteError.message);
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Post news</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title-en">Title (English)</Label>
              <Input id="title-en" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title-ar">Title (Arabic)</Label>
              <Input
                id="title-ar"
                required
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="font-arabic"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-en">Content (English)</Label>
            <Textarea
              id="content-en"
              rows={5}
              value={contentEn}
              onChange={(e) => setContentEn(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-ar">Content (Arabic)</Label>
            <Textarea
              id="content-ar"
              required
              rows={5}
              value={contentAr}
              onChange={(e) => setContentAr(e.target.value)}
              className="font-arabic"
            />
          </div>
          <div className="space-y-2">
            <Label>Cover Image (optional)</Label>
            <label className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-gold/40 bg-white/50 px-4 py-3 text-sm text-navy/60 hover:border-gold hover:text-navy transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
                disabled={uploadLoading}
              />
              {uploadLoading ? "Uploading..." : "Choose image from device"}
            </label>
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 rounded border border-gold/20 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage("");
                    setImagePreview("");
                  }}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            <span className="text-sm text-navy/70">
              <span className="font-medium text-navy">Family only</span> — hidden from the public
              News page, visible only in the Family Portal
            </span>
          </label>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Publishing..." : "Publish"}
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Published posts</h2>
        {postsLoading && <p className="mt-4 text-navy/60">Loading...</p>}
        {!postsLoading && posts.length === 0 && (
          <p className="mt-4 text-navy/60">No news posts yet.</p>
        )}
        <ul className="mt-4 space-y-3">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-gold/15 bg-white/60 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-navy">{post.title_en}</p>
                  {(post as NewsPost & { is_private?: boolean }).is_private && (
                    <span className="rounded bg-gold/20 px-1.5 py-0.5 text-xs text-gold">
                      Family Only
                    </span>
                  )}
                </div>
                <p className="font-arabic text-sm text-navy/60">{post.title_ar}</p>
                <p className="mt-1 text-xs text-navy/40">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                disabled={deletingId === post.id}
                onClick={() => void deletePost(post.id)}
              >
                {deletingId === post.id ? "Deleting..." : "Delete"}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const STORY_SECTIONS = [
  { label: "Before the Name", key: "story_s0" },
  { label: "The First House", key: "story_s1" },
  { label: "Across Generations", key: "story_s2" },
  { label: "What Remains", key: "story_s3" },
];

function OurStoryTab() {
  const sc = useSiteContent();
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  type FieldKey = string;
  const allKeys: FieldKey[] = [
    "story_patriarch_caption_en",
    "story_patriarch_caption_ar",
    ...STORY_SECTIONS.flatMap((s) => [
      `${s.key}_h_en`,
      `${s.key}_h_ar`,
      `${s.key}_p_en`,
      `${s.key}_p_ar`,
    ]),
  ];

  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(allKeys.map((k) => [k, ""])),
  );

  useEffect(() => {
    setFields((prev) => {
      const next = { ...prev };
      for (const k of allKeys) {
        if (sc[k] !== undefined) next[k] = sc[k];
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc]);

  const save = async (key: string) => {
    setSaving(key);
    setErrors((p) => ({ ...p, [key]: "" }));
    const err = await upsertSiteContent(key, fields[key]);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  };

  const uploadPatriarch = async (file: File) => {
    const key = "story_patriarch_image";
    setSaving(key);
    setErrors((p) => ({ ...p, [key]: "" }));
    const ext = file.name.split(".").pop();
    const path = `site/${key}-${Date.now()}.${ext}`;
    const { error: upErr } = await getSupabase()
      .storage.from("site-images")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setErrors((p) => ({ ...p, [key]: upErr.message }));
      setSaving(null);
      return;
    }
    const { data } = getSupabase().storage.from("site-images").getPublicUrl(path);
    const err = await upsertSiteContent(key, data.publicUrl);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  };

  const resetPatriarch = async () => {
    const key = "story_patriarch_image";
    setSaving(key);
    const err = await deleteSiteContent(key);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  };

  const patriarchKey = "story_patriarch_image";
  const patriarchSrc = sc[patriarchKey] || patriarchDefault;
  const isCustomPatriarch = Boolean(sc[patriarchKey]);

  return (
    <div className="space-y-8">
      {/* Patriarch photo */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Patriarch Photo</h2>
        <p className="mt-1 text-sm text-navy/60">The portrait shown beside the story text.</p>
        <div className="mt-4 max-w-xs space-y-2">
          <div className="relative">
            <img
              src={patriarchSrc}
              alt=""
              className="h-48 w-full rounded border border-gold/20 object-cover object-top"
            />
            <span
              className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-medium ${isCustomPatriarch ? "bg-gold text-navy" : "bg-navy/60 text-cream"}`}
            >
              {isCustomPatriarch ? "Custom" : "Default"}
            </span>
          </div>
          <div className="flex gap-2">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded border border-dashed border-gold/40 bg-white/50 px-4 py-2.5 text-sm text-navy/60 hover:border-gold hover:text-navy transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={saving === patriarchKey}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPatriarch(f);
                }}
              />
              {saving === patriarchKey ? "Uploading..." : isCustomPatriarch ? "Replace" : "Upload"}
            </label>
            {isCustomPatriarch && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:bg-red-50 hover:text-red-700"
                disabled={saving === patriarchKey}
                onClick={() => void resetPatriarch()}
              >
                Reset
              </Button>
            )}
          </div>
          {errors[patriarchKey] && <p className="text-xs text-red-600">{errors[patriarchKey]}</p>}
          {saved === patriarchKey && <p className="text-xs text-green-700">Saved!</p>}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              { label: "Photo Caption (English)", fk: "story_patriarch_caption_en", dir: "ltr" },
              { label: "Photo Caption (Arabic)", fk: "story_patriarch_caption_ar", dir: "rtl" },
            ].map(({ label, fk, dir }) => (
              <div key={fk} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  dir={dir}
                  value={fields[fk] ?? ""}
                  className={dir === "rtl" ? "font-arabic" : ""}
                  onChange={(e) => setFields((p) => ({ ...p, [fk]: e.target.value }))}
                />
                <Button size="sm" disabled={saving === fk} onClick={() => void save(fk)}>
                  {saving === fk ? "Saving..." : saved === fk ? "Saved!" : "Save"}
                </Button>
                {errors[fk] && <p className="text-xs text-red-600">{errors[fk]}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story sections */}
      {STORY_SECTIONS.map((section) => (
        <div key={section.key} className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
          <h2 className="font-serif-display text-2xl text-navy">{section.label}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Headings */}
            {[
              { label: "Heading (English)", fk: `${section.key}_h_en`, dir: "ltr" },
              { label: "Heading (Arabic)", fk: `${section.key}_h_ar`, dir: "rtl" },
            ].map(({ label, fk, dir }) => (
              <div key={fk} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  dir={dir}
                  value={fields[fk] ?? ""}
                  className={dir === "rtl" ? "font-arabic" : ""}
                  onChange={(e) => setFields((p) => ({ ...p, [fk]: e.target.value }))}
                />
                <Button size="sm" disabled={saving === fk} onClick={() => void save(fk)}>
                  {saving === fk ? "Saving..." : saved === fk ? "Saved!" : "Save"}
                </Button>
                {errors[fk] && <p className="text-xs text-red-600">{errors[fk]}</p>}
              </div>
            ))}
            {/* Paragraphs */}
            {[
              { label: "Paragraph (English)", fk: `${section.key}_p_en`, dir: "ltr" },
              { label: "Paragraph (Arabic)", fk: `${section.key}_p_ar`, dir: "rtl" },
            ].map(({ label, fk, dir }) => (
              <div key={fk} className="space-y-2">
                <Label>{label}</Label>
                <Textarea
                  rows={5}
                  dir={dir}
                  value={fields[fk] ?? ""}
                  className={dir === "rtl" ? "font-arabic" : ""}
                  onChange={(e) => setFields((p) => ({ ...p, [fk]: e.target.value }))}
                />
                <Button size="sm" disabled={saving === fk} onClick={() => void save(fk)}>
                  {saving === fk ? "Saving..." : saved === fk ? "Saved!" : "Save"}
                </Button>
                {errors[fk] && <p className="text-xs text-red-600">{errors[fk]}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Module-level so React never sees a new component type on re-render — fixes focus loss on keystroke
function HCTextField({
  label,
  contentKey,
  rows = 1,
  dir,
  initialValue,
  saving,
  saved,
  error,
  onSave,
}: {
  label: string;
  contentKey: string;
  rows?: number;
  dir?: string;
  initialValue: string;
  saving: string | null;
  saved: string | null;
  error?: string;
  onSave: (key: string, value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {rows > 1 ? (
        <Textarea
          rows={rows}
          dir={dir}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={dir === "rtl" ? "font-arabic" : ""}
        />
      ) : (
        <Input
          dir={dir}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={dir === "rtl" ? "font-arabic" : ""}
        />
      )}
      <Button size="sm" disabled={saving === contentKey} onClick={() => onSave(contentKey, value)}>
        {saving === contentKey ? "Saving..." : saved === contentKey ? "Saved!" : "Save"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function HCImageField({
  label,
  contentKey,
  defaultSrc,
  customSrc,
  saving,
  saved,
  error,
  onUpload,
  onReset,
}: {
  label: string;
  contentKey: string;
  defaultSrc?: string;
  customSrc?: string;
  saving: string | null;
  saved: string | null;
  error?: string;
  onUpload: (key: string, file: File) => void;
  onReset: (key: string) => void;
}) {
  const previewSrc = customSrc || defaultSrc;
  const isCustom = Boolean(customSrc);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {previewSrc && (
        <div className="relative">
          <img
            src={previewSrc}
            alt=""
            className="h-28 w-full rounded border border-gold/20 object-cover"
          />
          {isCustom && (
            <span className="absolute left-2 top-2 rounded bg-gold px-2 py-0.5 text-xs font-medium text-navy">
              Custom
            </span>
          )}
          {!isCustom && defaultSrc && (
            <span className="absolute left-2 top-2 rounded bg-navy/60 px-2 py-0.5 text-xs text-cream">
              Default
            </span>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded border border-dashed border-gold/40 bg-white/50 px-4 py-2.5 text-sm text-navy/60 hover:border-gold hover:text-navy transition-colors">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={saving === contentKey}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(contentKey, f);
            }}
          />
          {saving === contentKey ? "Uploading..." : isCustom ? "Replace" : "Upload"}
        </label>
        {isCustom && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
            disabled={saving === contentKey}
            onClick={() => onReset(contentKey)}
          >
            Reset
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved === contentKey && (
        <p className="text-xs text-green-700">{isCustom ? "Reset to default!" : "Saved!"}</p>
      )}
    </div>
  );
}

function HomeContentTab() {
  const sc = useSiteContent();
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useCallback(async (key: string, value: string) => {
    setSaving(key);
    setErrors((p) => ({ ...p, [key]: "" }));
    const err = await upsertSiteContent(key, value);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  }, []);

  const uploadImage = useCallback(async (key: string, file: File) => {
    setSaving(key);
    setErrors((p) => ({ ...p, [key]: "" }));
    const ext = file.name.split(".").pop();
    const path = `site/${key}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await getSupabase()
      .storage.from("site-images")
      .upload(path, file, { upsert: true });
    if (uploadErr) {
      setErrors((p) => ({ ...p, [key]: uploadErr.message }));
      setSaving(null);
      return;
    }
    const { data } = getSupabase().storage.from("site-images").getPublicUrl(path);
    const err = await upsertSiteContent(key, data.publicUrl);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  }, []);

  const resetImage = useCallback(async (key: string) => {
    setSaving(key);
    const err = await deleteSiteContent(key);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  }, []);

  const tf = (label: string, contentKey: string, rows = 1, dir?: string) => (
    <HCTextField
      key={contentKey}
      label={label}
      contentKey={contentKey}
      rows={rows}
      dir={dir}
      initialValue={sc[contentKey] ?? ""}
      saving={saving}
      saved={saved}
      error={errors[contentKey]}
      onSave={save}
    />
  );

  const imgf = (label: string, contentKey: string, defaultSrc?: string) => (
    <HCImageField
      key={contentKey}
      label={label}
      contentKey={contentKey}
      defaultSrc={defaultSrc}
      customSrc={sc[contentKey]}
      saving={saving}
      saved={saved}
      error={errors[contentKey]}
      onUpload={uploadImage}
      onReset={resetImage}
    />
  );

  const businessDefaults = [b1Default, b2Default, b3Default, b1Default, b2Default, b3Default];

  return (
    <div className="space-y-8">
      {/* Site Name */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Family Name</h2>
        <p className="mt-1 text-sm text-navy/60">
          Shown in the navbar and hero. Leave blank to use the default.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {tf("Name (English)", "site_name_en")}
          {tf("Name (Arabic)", "site_name_ar", 1, "rtl")}
        </div>
      </div>

      {/* Hero */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Hero Section</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            {imgf("Background Image", "hero_image_url", heroDefault)}
          </div>
          {tf("Eyebrow (English)", "hero_eyebrow_en")}
          {tf("Eyebrow (Arabic)", "hero_eyebrow_ar", 1, "rtl")}
          {tf("Tagline (English)", "hero_tagline_en")}
          {tf("Tagline (Arabic)", "hero_tagline_ar", 1, "rtl")}
        </div>
      </div>

      {/* Origin */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Origin Section</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            {imgf("Section Photo", "origin_image_url", originDefault)}
          </div>
          {tf("Title (English)", "origin_title_en")}
          {tf("Title (Arabic)", "origin_title_ar", 1, "rtl")}
          {tf("Paragraph 1 (English)", "origin_p1_en", 4)}
          {tf("Paragraph 1 (Arabic)", "origin_p1_ar", 4, "rtl")}
          {tf("Paragraph 2 (English)", "origin_p2_en", 4)}
          {tf("Paragraph 2 (Arabic)", "origin_p2_ar", 4, "rtl")}
          {tf("Pull Quote (English)", "origin_pull_en", 2)}
          {tf("Pull Quote (Arabic)", "origin_pull_ar", 2, "rtl")}
          {tf("Quote Author (English)", "origin_pull_author_en")}
          {tf("Quote Author (Arabic)", "origin_pull_author_ar", 1, "rtl")}
        </div>
      </div>

      {/* Business card images */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Business Card Images</h2>
        <p className="mt-1 text-sm text-navy/60">One image per card (6 cards total).</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) =>
            imgf(`Card ${i + 1}`, `business_image_${i}`, businessDefaults[i]),
          )}
        </div>
      </div>

      {/* Legacy text */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Legacy Section Text</h2>
        <p className="mt-1 text-sm text-navy/60">
          Section title, intro, and each card's name, story and year. Images are above.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {tf("Title (English)", "legacy_title_en")}
          {tf("Title (Arabic)", "legacy_title_ar", 1, "rtl")}
          {tf("Intro (English)", "legacy_intro_en", 3)}
          {tf("Intro (Arabic)", "legacy_intro_ar", 3, "rtl")}
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="mt-6 border-t border-gold/15 pt-6">
            <p className="mb-4 font-medium text-navy">Card {i + 1}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {tf("Year", `legacy_card_${i}_year`)}
              <div />
              {tf("Name (English)", `legacy_card_${i}_name_en`)}
              {tf("Name (Arabic)", `legacy_card_${i}_name_ar`, 1, "rtl")}
              {tf("Story (English)", `legacy_card_${i}_story_en`, 3)}
              {tf("Story (Arabic)", `legacy_card_${i}_story_ar`, 3, "rtl")}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Generations Timeline</h2>
        <p className="mt-1 text-sm text-navy/60">Section title and all four generation cards.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {tf("Section Title (English)", "timeline_title_en")}
          {tf("Section Title (Arabic)", "timeline_title_ar", 1, "rtl")}
        </div>
        {[
          { label: "1st Generation", key: "timeline_0" },
          { label: "2nd Generation", key: "timeline_1" },
          { label: "3rd Generation", key: "timeline_2" },
          { label: "4th Generation", key: "timeline_3" },
        ].map(({ label, key }) => (
          <div key={key} className="mt-6 border-t border-gold/15 pt-6">
            <p className="mb-4 font-medium text-navy">{label}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {tf("Year / Era", `${key}_year`)}
              <div />
              {tf("Generation Name (English)", `${key}_gen_en`)}
              {tf("Generation Name (Arabic)", `${key}_gen_ar`, 1, "rtl")}
              {tf("Description (English)", `${key}_text_en`, 3)}
              {tf("Description (Arabic)", `${key}_text_ar`, 3, "rtl")}
            </div>
          </div>
        ))}
      </div>

      {/* Portal CTA */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Portal CTA Section</h2>
        <p className="mt-1 text-sm text-navy/60">
          The "For the Family" section with sign-in and request access buttons.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {tf("Eyebrow (English)", "portal_eyebrow_en")}
          {tf("Eyebrow (Arabic)", "portal_eyebrow_ar", 1, "rtl")}
          {tf("Title (English)", "portal_title_en")}
          {tf("Title (Arabic)", "portal_title_ar", 1, "rtl")}
          {tf("Body Text (English)", "portal_body_en", 3)}
          {tf("Body Text (Arabic)", "portal_body_ar", 3, "rtl")}
          {tf("Sign In Button (English)", "portal_login_en")}
          {tf("Sign In Button (Arabic)", "portal_login_ar", 1, "rtl")}
          {tf("Request Access Button (English)", "portal_request_en")}
          {tf("Request Access Button (Arabic)", "portal_request_ar", 1, "rtl")}
        </div>
      </div>

      {/* Values */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Values Section</h2>
        <p className="mt-1 text-sm text-navy/60">
          The "What We Inherit" section with 5 value cards.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {tf("Eyebrow (English)", "values_eyebrow_en")}
          {tf("Eyebrow (Arabic)", "values_eyebrow_ar", 1, "rtl")}
          {tf("Title (English)", "values_title_en")}
          {tf("Title (Arabic)", "values_title_ar", 1, "rtl")}
        </div>
        {[
          { label: "Card 1 — Trust / الأمانة", i: 0 },
          { label: "Card 2 — Generosity / الكرم", i: 1 },
          { label: "Card 3 — Loyalty / الوفاء", i: 2 },
          { label: "Card 4 — Knowledge / العلم", i: 3 },
          { label: "Card 5 — Patience / الصبر", i: 4 },
        ].map(({ label, i }) => (
          <div key={i} className="mt-6 border-t border-gold/15 pt-6">
            <p className="mb-4 font-medium text-navy">{label}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {tf("Arabic Word", `values_card_${i}_ar`, 1, "rtl")}
              <div />
              {tf("Name (English)", `values_card_${i}_name_en`)}
              {tf("Name (Arabic)", `values_card_${i}_name_ar`, 1, "rtl")}
              {tf("Description (English)", `values_card_${i}_desc_en`, 2)}
              {tf("Description (Arabic)", `values_card_${i}_desc_ar`, 2, "rtl")}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Footer</h2>
        <p className="mt-1 text-sm text-navy/60">
          Text shown in the footer (links are not editable here).
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {tf("Subtitle (English)", "footer_line1_en")}
          {tf("Subtitle (Arabic)", "footer_line1_ar", 1, "rtl")}
          {tf("Tagline (English)", "footer_line2_en")}
          {tf("Tagline (Arabic)", "footer_line2_ar", 1, "rtl")}
          {tf("Middle Quote (English)", "footer_quote_en")}
          {tf("Middle Quote (Arabic)", "footer_quote_ar", 1, "rtl")}
          {tf("Copyright Text (English)", "footer_rights_en")}
          {tf("Copyright Text (Arabic)", "footer_rights_ar", 1, "rtl")}
        </div>
      </div>
    </div>
  );
}

function GalleryTab() {
  const sc = useSiteContent();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useCallback(async (key: string, value: string) => {
    setSaving(key);
    setErrors((p) => ({ ...p, [key]: "" }));
    const err = await upsertSiteContent(key, value);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  }, []);

  const tf = (label: string, contentKey: string, rows = 1, dir?: string) => (
    <HCTextField
      key={contentKey}
      label={label}
      contentKey={contentKey}
      rows={rows}
      dir={dir}
      initialValue={sc[contentKey] ?? ""}
      saving={saving}
      saved={saved}
      error={errors[contentKey]}
      onSave={save}
    />
  );

  const loadImages = useCallback(async () => {
    setLoading(true);
    const { data } = await getSupabase()
      .storage.from("gallery-images")
      .list("gallery", {
        sortBy: { column: "created_at", order: "desc" },
      });
    if (data) {
      const imgs = data
        .filter((f) => f.name !== ".emptyFolderPlaceholder")
        .map((f) => ({
          name: f.name,
          url: getSupabase().storage.from("gallery-images").getPublicUrl(`gallery/${f.name}`).data
            .publicUrl,
          created_at: f.created_at ?? "",
        }));
      setImages(imgs);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadError("");
    setUploading(true);
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await getSupabase()
        .storage.from("gallery-images")
        .upload(path, file, { upsert: true });
      if (error) {
        setUploadError(`Upload failed: ${error.message}`);
        break;
      }
    }
    setUploading(false);
    e.target.value = "";
    void loadImages();
  };

  const deleteImage = async (name: string) => {
    setDeletingName(name);
    await getSupabase()
      .storage.from("gallery-images")
      .remove([`gallery/${name}`]);
    setImages((prev) => prev.filter((img) => img.name !== name));
    setDeletingName(null);
  };

  return (
    <div className="space-y-8">
      {/* Page text */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Archive Page Text</h2>
        <p className="mt-1 text-sm text-navy/60">
          Headings and paragraphs shown on the Archive page.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {tf("Eyebrow (English)", "gallery_eyebrow_en")}
          {tf("Eyebrow (Arabic)", "gallery_eyebrow_ar", 1, "rtl")}
          {tf("Title (English)", "gallery_title_en")}
          {tf("Title (Arabic)", "gallery_title_ar", 1, "rtl")}
          {tf("Intro (English)", "gallery_intro_en", 3)}
          {tf("Intro (Arabic)", "gallery_intro_ar", 3, "rtl")}
          {tf("Bottom Paragraph (English)", "gallery_bottom_en", 3)}
          {tf("Bottom Paragraph (Arabic)", "gallery_bottom_ar", 3, "rtl")}
          {tf("Button Text (English)", "gallery_view_en")}
          {tf("Button Text (Arabic)", "gallery_view_ar", 1, "rtl")}
        </div>
      </div>

      {/* Images */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Archive Gallery</h2>
        <p className="mt-1 text-sm text-navy/60">
          Images uploaded here appear on the public Archive page.
        </p>

        <div className="mt-6">
          <label className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-gold/40 bg-white/50 px-4 py-3 text-sm text-navy/60 hover:border-gold hover:text-navy transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            {uploading ? "Uploading..." : "Choose photos to upload (multiple allowed)"}
          </label>
          {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
        </div>

        {loading && <p className="mt-6 text-navy/60">Loading images...</p>}
        {!loading && images.length === 0 && (
          <p className="mt-6 text-navy/60">No images uploaded yet.</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.name}
              className="group relative overflow-hidden rounded-lg border border-gold/20"
            >
              <img src={img.url} alt="" className="h-32 w-full object-cover" />
              <button
                onClick={() => void deleteImage(img.name)}
                disabled={deletingName === img.name}
                className="absolute inset-0 flex items-center justify-center bg-red-600/80 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <span className="rounded bg-white px-2 py-1 text-xs font-medium text-red-600">
                  {deletingName === img.name ? "Deleting..." : "Delete"}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
