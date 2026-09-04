import { StaffTab } from "@/components/admin/StaffTab";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { inviteFamilyMember } from "@/lib/api/invite-member";
import { removeFamilyMember } from "@/lib/api/remove-member";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import heroDefault from "@/assets/hero-heritage.jpg";
import originDefault from "@/assets/story-album.jpg";
import b1Default from "@/assets/business-1.jpg";
import b2Default from "@/assets/business-2.jpg";
import b3Default from "@/assets/business-3.jpg";
import patriarchDefault from "@/assets/patriarch.jpg";

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
            message: "You must sign in to access the admin dashboard.",
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

        if (!profile || !["owner","admin","moderator"].includes(profile.role)) {
          setAuth({
            status: "denied",
            message:
              "Your account does not have admin access. Make sure your user has role = 'admin' in the profiles table.",
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
        <p className="font-serif-display text-lg text-navy/70">Checking access...</p>
      </section>
    );
  }

  if (auth.status === "denied") {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-6 py-32">
        <div className="max-w-md text-center">
          <h1 className="font-serif-display text-3xl text-navy">Access denied</h1>
          <p className="mt-4 text-navy/70">{auth.message}</p>
          <Link to="/portal" className="btn-gold mt-8 inline-flex">
            Go to sign in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-32">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-gold">Admin</p>
          <h1 className="mt-2 font-serif-display text-4xl text-navy">Family Dashboard</h1>
          <p className="mt-2 text-sm text-navy/60">
            Signed in as {auth.profile.full_name ?? auth.profile.email ?? auth.profile.id}
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>

      <Tabs defaultValue="requests" className="mt-10">
        <TabsList className="h-auto flex-wrap gap-1 bg-navy/5 p-1">
          <TabsTrigger value="requests">Join Requests</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="home">Home Content</TabsTrigger>
          <TabsTrigger value="our-story">Our Story</TabsTrigger>
          <TabsTrigger value="members">Add Member</TabsTrigger>
          <TabsTrigger value="view-members">Family Members</TabsTrigger>
          <TabsTrigger value="staff">المشرفون والصلاحيات</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <JoinRequestsTab />
        </TabsContent>
        <TabsContent value="news" className="mt-6">
          <NewsTab />
        </TabsContent>
        <TabsContent value="gallery" className="mt-6">
          <GalleryTab />
        </TabsContent>
        <TabsContent value="home" className="mt-6">
          <HomeContentTab />
        </TabsContent>
        <TabsContent value="our-story" className="mt-6">
          <OurStoryTab />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <AddMemberTab />
        </TabsContent>
        <TabsContent value="view-members" className="mt-6">
          <FamilyMembersTab />
        </TabsContent>
        <TabsContent value="staff" className="mt-6">
          <StaffTab me={{ id: auth.profile.id, role: auth.profile.role }} />
        </TabsContent>
      </Tabs>
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
      .select("id, full_name_en, email, message, status, created_at")
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
      let relationship: string | null = null;
      if (request.message?.startsWith("Relation: ")) {
        relationship = request.message.split("\n")[0].replace("Relation: ", "").trim() || null;
      }

      const { error: memberError } = await getSupabase().from("family_members").insert({
        full_name_en: request.full_name_en,
        relation: relationship,
        email: request.email,
      });

      if (memberError) {
        setError(`Could not add to family members: ${memberError.message}`);
        setActionId(null);
        return;
      }

      // Send invite email so they can actually log in
      const invite = await inviteFamilyMember({
        data: { email: request.email, fullName: request.full_name_en },
      });
      if (!invite.success) {
        setError(`Member added but invite failed: ${invite.error ?? "unknown error"}. You can resend from the Family Members tab.`);
        setActionId(null);
        return;
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
          <li
            key={request.id}
            className="rounded-lg border border-gold/15 bg-white/60 p-4"
          >
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

  useEffect(() => { void loadPosts(); }, [loadPosts]);

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
    const { error: insertError } = await getSupabase().from("news_posts").insert({
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
      setTitleEn(""); setTitleAr(""); setContentEn(""); setContentAr("");
      setCoverImage(""); setImagePreview(""); setIsPrivate(false);
      void loadPosts();
    }
    setLoading(false);
  };

  const deletePost = async (id: string) => {
    setDeletingId(id);
    const { error: deleteError } = await getSupabase()
      .from("news_posts")
      .delete()
      .eq("id", id);
    if (!deleteError) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
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
              <Input id="title-ar" required value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="font-arabic" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-en">Content (English)</Label>
            <Textarea id="content-en" rows={5} value={contentEn} onChange={(e) => setContentEn(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-ar">Content (Arabic)</Label>
            <Textarea id="content-ar" required rows={5} value={contentAr} onChange={(e) => setContentAr(e.target.value)} className="font-arabic" />
          </div>
          <div className="space-y-2">
            <Label>Cover Image (optional)</Label>
            <label className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-gold/40 bg-white/50 px-4 py-3 text-sm text-navy/60 hover:border-gold hover:text-navy transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} disabled={uploadLoading} />
              {uploadLoading ? "Uploading..." : "Choose image from device"}
            </label>
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-40 rounded border border-gold/20 object-cover" />
                <button type="button" onClick={() => { setCoverImage(""); setImagePreview(""); }} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600">×</button>
              </div>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="h-4 w-4 accent-gold" />
            <span className="text-sm text-navy/70">
              <span className="font-medium text-navy">Family only</span> — hidden from the public News page, visible only in the Family Portal
            </span>
          </label>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <Button type="submit" disabled={loading}>{loading ? "Publishing..." : "Publish"}</Button>
        </form>
      </div>

      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Published posts</h2>
        {postsLoading && <p className="mt-4 text-navy/60">Loading...</p>}
        {!postsLoading && posts.length === 0 && <p className="mt-4 text-navy/60">No news posts yet.</p>}
        <ul className="mt-4 space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="flex items-start justify-between gap-4 rounded-lg border border-gold/15 bg-white/60 px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-navy">{post.title_en}</p>
                  {(post as NewsPost & { is_private?: boolean }).is_private && (
                    <span className="rounded bg-gold/20 px-1.5 py-0.5 text-xs text-gold">Family Only</span>
                  )}
                </div>
                <p className="font-arabic text-sm text-navy/60">{post.title_ar}</p>
                <p className="mt-1 text-xs text-navy/40">{new Date(post.created_at).toLocaleDateString()}</p>
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
  { label: "The First House",  key: "story_s1" },
  { label: "Across Generations", key: "story_s2" },
  { label: "What Remains",    key: "story_s3" },
];

function OurStoryTab() {
  const sc = useSiteContent();
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved]   = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  type FieldKey = string;
  const allKeys: FieldKey[] = [
    "story_patriarch_caption_en",
    "story_patriarch_caption_ar",
    ...STORY_SECTIONS.flatMap((s) => [
      `${s.key}_h_en`, `${s.key}_h_ar`,
      `${s.key}_p_en`, `${s.key}_p_ar`,
    ]),
  ];

  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(allKeys.map((k) => [k, ""]))
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
    else { setSaved(key); setTimeout(() => setSaved(null), 2000); }
    setSaving(null);
  };

  const uploadPatriarch = async (file: File) => {
    const key = "story_patriarch_image";
    setSaving(key);
    setErrors((p) => ({ ...p, [key]: "" }));
    const ext = file.name.split(".").pop();
    const path = `site/${key}-${Date.now()}.${ext}`;
    const { error: upErr } = await getSupabase().storage.from("site-images").upload(path, file, { upsert: true });
    if (upErr) { setErrors((p) => ({ ...p, [key]: upErr.message })); setSaving(null); return; }
    const { data } = getSupabase().storage.from("site-images").getPublicUrl(path);
    const err = await upsertSiteContent(key, data.publicUrl);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else { setSaved(key); setTimeout(() => setSaved(null), 2000); }
    setSaving(null);
  };

  const resetPatriarch = async () => {
    const key = "story_patriarch_image";
    setSaving(key);
    const err = await deleteSiteContent(key);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else { setSaved(key); setTimeout(() => setSaved(null), 2000); }
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
            <img src={patriarchSrc} alt="" className="h-48 w-full rounded border border-gold/20 object-cover object-top" />
            <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-medium ${isCustomPatriarch ? "bg-gold text-navy" : "bg-navy/60 text-cream"}`}>
              {isCustomPatriarch ? "Custom" : "Default"}
            </span>
          </div>
          <div className="flex gap-2">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded border border-dashed border-gold/40 bg-white/50 px-4 py-2.5 text-sm text-navy/60 hover:border-gold hover:text-navy transition-colors">
              <input type="file" accept="image/*" className="hidden" disabled={saving === patriarchKey}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadPatriarch(f); }} />
              {saving === patriarchKey ? "Uploading..." : isCustomPatriarch ? "Replace" : "Upload"}
            </label>
            {isCustomPatriarch && (
              <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-700"
                disabled={saving === patriarchKey} onClick={() => void resetPatriarch()}>
                Reset
              </Button>
            )}
          </div>
          {errors[patriarchKey] && <p className="text-xs text-red-600">{errors[patriarchKey]}</p>}
          {saved === patriarchKey && <p className="text-xs text-green-700">Saved!</p>}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              { label: "Photo Caption (English)", fk: "story_patriarch_caption_en", dir: "ltr" },
              { label: "Photo Caption (Arabic)",  fk: "story_patriarch_caption_ar", dir: "rtl" },
            ].map(({ label, fk, dir }) => (
              <div key={fk} className="space-y-2">
                <Label>{label}</Label>
                <Input dir={dir} value={fields[fk] ?? ""} className={dir === "rtl" ? "font-arabic" : ""}
                  onChange={(e) => setFields((p) => ({ ...p, [fk]: e.target.value }))} />
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
              { label: "Heading (Arabic)",  fk: `${section.key}_h_ar`, dir: "rtl" },
            ].map(({ label, fk, dir }) => (
              <div key={fk} className="space-y-2">
                <Label>{label}</Label>
                <Input dir={dir} value={fields[fk] ?? ""} className={dir === "rtl" ? "font-arabic" : ""}
                  onChange={(e) => setFields((p) => ({ ...p, [fk]: e.target.value }))} />
                <Button size="sm" disabled={saving === fk}
                  onClick={() => void save(fk)}>
                  {saving === fk ? "Saving..." : saved === fk ? "Saved!" : "Save"}
                </Button>
                {errors[fk] && <p className="text-xs text-red-600">{errors[fk]}</p>}
              </div>
            ))}
            {/* Paragraphs */}
            {[
              { label: "Paragraph (English)", fk: `${section.key}_p_en`, dir: "ltr" },
              { label: "Paragraph (Arabic)",  fk: `${section.key}_p_ar`, dir: "rtl" },
            ].map(({ label, fk, dir }) => (
              <div key={fk} className="space-y-2">
                <Label>{label}</Label>
                <Textarea rows={5} dir={dir} value={fields[fk] ?? ""} className={dir === "rtl" ? "font-arabic" : ""}
                  onChange={(e) => setFields((p) => ({ ...p, [fk]: e.target.value }))} />
                <Button size="sm" disabled={saving === fk}
                  onClick={() => void save(fk)}>
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
  label, contentKey, rows = 1, dir, initialValue, saving, saved, error, onSave,
}: {
  label: string; contentKey: string; rows?: number; dir?: string;
  initialValue: string; saving: string | null; saved: string | null;
  error?: string; onSave: (key: string, value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => { if (initialValue) setValue(initialValue); }, [initialValue]);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {rows > 1
        ? <Textarea rows={rows} dir={dir} value={value} onChange={(e) => setValue(e.target.value)} className={dir === "rtl" ? "font-arabic" : ""} />
        : <Input dir={dir} value={value} onChange={(e) => setValue(e.target.value)} className={dir === "rtl" ? "font-arabic" : ""} />
      }
      <Button size="sm" disabled={saving === contentKey} onClick={() => onSave(contentKey, value)}>
        {saving === contentKey ? "Saving..." : saved === contentKey ? "Saved!" : "Save"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function HCImageField({
  label, contentKey, defaultSrc, customSrc, saving, saved, error, onUpload, onReset,
}: {
  label: string; contentKey: string; defaultSrc?: string; customSrc?: string;
  saving: string | null; saved: string | null; error?: string;
  onUpload: (key: string, file: File) => void; onReset: (key: string) => void;
}) {
  const previewSrc = customSrc || defaultSrc;
  const isCustom = Boolean(customSrc);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {previewSrc && (
        <div className="relative">
          <img src={previewSrc} alt="" className="h-28 w-full rounded border border-gold/20 object-cover" />
          {isCustom && <span className="absolute left-2 top-2 rounded bg-gold px-2 py-0.5 text-xs font-medium text-navy">Custom</span>}
          {!isCustom && defaultSrc && <span className="absolute left-2 top-2 rounded bg-navy/60 px-2 py-0.5 text-xs text-cream">Default</span>}
        </div>
      )}
      <div className="flex gap-2">
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded border border-dashed border-gold/40 bg-white/50 px-4 py-2.5 text-sm text-navy/60 hover:border-gold hover:text-navy transition-colors">
          <input type="file" accept="image/*" className="hidden" disabled={saving === contentKey}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(contentKey, f); }} />
          {saving === contentKey ? "Uploading..." : isCustom ? "Replace" : "Upload"}
        </label>
        {isCustom && (
          <Button type="button" size="sm" variant="ghost" className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
            disabled={saving === contentKey} onClick={() => onReset(contentKey)}>
            Reset
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved === contentKey && <p className="text-xs text-green-700">{isCustom ? "Reset to default!" : "Saved!"}</p>}
    </div>
  );
}

function HomeContentTab() {
  const sc = useSiteContent();
  const [saving, setSaving] = useState<string | null>(null);
  const [saved,  setSaved]  = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useCallback(async (key: string, value: string) => {
    setSaving(key);
    setErrors((p) => ({ ...p, [key]: "" }));
    const err = await upsertSiteContent(key, value);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else { setSaved(key); setTimeout(() => setSaved(null), 2000); }
    setSaving(null);
  }, []);

  const uploadImage = useCallback(async (key: string, file: File) => {
    setSaving(key);
    setErrors((p) => ({ ...p, [key]: "" }));
    const ext = file.name.split(".").pop();
    const path = `site/${key}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await getSupabase().storage.from("site-images").upload(path, file, { upsert: true });
    if (uploadErr) { setErrors((p) => ({ ...p, [key]: uploadErr.message })); setSaving(null); return; }
    const { data } = getSupabase().storage.from("site-images").getPublicUrl(path);
    const err = await upsertSiteContent(key, data.publicUrl);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else { setSaved(key); setTimeout(() => setSaved(null), 2000); }
    setSaving(null);
  }, []);

  const resetImage = useCallback(async (key: string) => {
    setSaving(key);
    const err = await deleteSiteContent(key);
    if (err) setErrors((p) => ({ ...p, [key]: err }));
    else { setSaved(key); setTimeout(() => setSaved(null), 2000); }
    setSaving(null);
  }, []);

  const tf = (label: string, contentKey: string, rows = 1, dir?: string) => (
    <HCTextField key={contentKey} label={label} contentKey={contentKey} rows={rows} dir={dir}
      initialValue={sc[contentKey] ?? ""} saving={saving} saved={saved}
      error={errors[contentKey]} onSave={save} />
  );

  const imgf = (label: string, contentKey: string, defaultSrc?: string) => (
    <HCImageField key={contentKey} label={label} contentKey={contentKey} defaultSrc={defaultSrc}
      customSrc={sc[contentKey]} saving={saving} saved={saved}
      error={errors[contentKey]} onUpload={uploadImage} onReset={resetImage} />
  );

  const businessDefaults = [b1Default, b2Default, b3Default, b1Default, b2Default, b3Default];

  return (
    <div className="space-y-8">
      {/* Site Name */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Family Name</h2>
        <p className="mt-1 text-sm text-navy/60">Shown in the navbar and hero. Leave blank to use the default.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {tf("Name (English)", "site_name_en")}
          {tf("Name (Arabic)", "site_name_ar", 1, "rtl")}
        </div>
      </div>

      {/* Hero */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Hero Section</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">{imgf("Background Image", "hero_image_url", heroDefault)}</div>
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
          <div className="md:col-span-2">{imgf("Section Photo", "origin_image_url", originDefault)}</div>
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
          {[0,1,2,3,4,5].map((i) => imgf(`Card ${i+1}`, `business_image_${i}`, businessDefaults[i]))}
        </div>
      </div>

      {/* Legacy text */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Legacy Section Text</h2>
        <p className="mt-1 text-sm text-navy/60">Section title, intro, and each card's name, story and year. Images are above.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {tf("Title (English)", "legacy_title_en")}
          {tf("Title (Arabic)", "legacy_title_ar", 1, "rtl")}
          {tf("Intro (English)", "legacy_intro_en", 3)}
          {tf("Intro (Arabic)", "legacy_intro_ar", 3, "rtl")}
        </div>
        {[0,1,2,3,4,5].map((i) => (
          <div key={i} className="mt-6 border-t border-gold/15 pt-6">
            <p className="mb-4 font-medium text-navy">Card {i+1}</p>
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
        <p className="mt-1 text-sm text-navy/60">The "For the Family" section with sign-in and request access buttons.</p>
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
        <p className="mt-1 text-sm text-navy/60">The "What We Inherit" section with 5 value cards.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {tf("Eyebrow (English)", "values_eyebrow_en")}
          {tf("Eyebrow (Arabic)", "values_eyebrow_ar", 1, "rtl")}
          {tf("Title (English)", "values_title_en")}
          {tf("Title (Arabic)", "values_title_ar", 1, "rtl")}
        </div>
        {[
          { label: "Card 1 — Trust / الأمانة",    i: 0 },
          { label: "Card 2 — Generosity / الكرم", i: 1 },
          { label: "Card 3 — Loyalty / الوفاء",   i: 2 },
          { label: "Card 4 — Knowledge / العلم",  i: 3 },
          { label: "Card 5 — Patience / الصبر",   i: 4 },
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
        <p className="mt-1 text-sm text-navy/60">Text shown in the footer (links are not editable here).</p>
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
    else { setSaved(key); setTimeout(() => setSaved(null), 2000); }
    setSaving(null);
  }, []);

  const tf = (label: string, contentKey: string, rows = 1, dir?: string) => (
    <HCTextField key={contentKey} label={label} contentKey={contentKey} rows={rows} dir={dir}
      initialValue={sc[contentKey] ?? ""} saving={saving} saved={saved}
      error={errors[contentKey]} onSave={save} />
  );

  const loadImages = useCallback(async () => {
    setLoading(true);
    const { data } = await getSupabase().storage.from("gallery-images").list("gallery", {
      sortBy: { column: "created_at", order: "desc" },
    });
    if (data) {
      const imgs = data
        .filter((f) => f.name !== ".emptyFolderPlaceholder")
        .map((f) => ({
          name: f.name,
          url: getSupabase().storage.from("gallery-images").getPublicUrl(`gallery/${f.name}`).data.publicUrl,
          created_at: f.created_at ?? "",
        }));
      setImages(imgs);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadImages(); }, [loadImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadError("");
    setUploading(true);
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await getSupabase().storage.from("gallery-images").upload(path, file, { upsert: true });
      if (error) { setUploadError(`Upload failed: ${error.message}`); break; }
    }
    setUploading(false);
    e.target.value = "";
    void loadImages();
  };

  const deleteImage = async (name: string) => {
    setDeletingName(name);
    await getSupabase().storage.from("gallery-images").remove([`gallery/${name}`]);
    setImages((prev) => prev.filter((img) => img.name !== name));
    setDeletingName(null);
  };

  return (
    <div className="space-y-8">
      {/* Page text */}
      <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
        <h2 className="font-serif-display text-2xl text-navy">Archive Page Text</h2>
        <p className="mt-1 text-sm text-navy/60">Headings and paragraphs shown on the Archive page.</p>
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
      <p className="mt-1 text-sm text-navy/60">Images uploaded here appear on the public Archive page.</p>

      <div className="mt-6">
        <label className="flex cursor-pointer items-center gap-3 rounded border border-dashed border-gold/40 bg-white/50 px-4 py-3 text-sm text-navy/60 hover:border-gold hover:text-navy transition-colors">
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          {uploading ? "Uploading..." : "Choose photos to upload (multiple allowed)"}
        </label>
        {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
      </div>

      {loading && <p className="mt-6 text-navy/60">Loading images...</p>}
      {!loading && images.length === 0 && <p className="mt-6 text-navy/60">No images uploaded yet.</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img) => (
          <div key={img.name} className="group relative overflow-hidden rounded-lg border border-gold/20">
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

function AddMemberTab() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const { error: insertError } = await getSupabase().from("family_members").insert({
      full_name_en: fullName.trim(),
      relation: relationship.trim() || null,
      email: email.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Send invite so they can log in
    const invite = await inviteFamilyMember({
      data: { email: email.trim(), fullName: fullName.trim() },
    });

    if (!invite.success) {
      setError(`Member added but invite failed: ${invite.error ?? "unknown error"}`);
    } else {
      setMessage(`Family member added. Invite email sent to ${email.trim()}.`);
      setFullName("");
      setEmail("");
      setRelationship("");
    }

    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
      <h2 className="font-serif-display text-2xl text-navy">Add family member</h2>
      <p className="mt-1 text-sm text-navy/60">An invite email will be sent so they can set their password and log in.</p>
      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        <div className="space-y-2">
          <Label htmlFor="member-name">Full name</Label>
          <Input id="member-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-email">Email address</Label>
          <Input id="member-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="family@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-relationship">Relationship</Label>
          <Input id="member-relationship" placeholder="e.g. cousin, aunt, son" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Sending invite..." : "Add member & send invite"}
        </Button>
      </form>
    </div>
  );
}

function FamilyMembersTab() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await getSupabase()
      .from("family_members")
      .select("id, full_name_en, full_name_ar, relation, birth_year, death_year, photo_url, email, created_at")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMembers((data ?? []) as FamilyMember[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  const removeMember = async (id: string, email?: string | null) => {
    const result = await removeFamilyMember({ data: { memberId: id, email } });
    if (!result.success) {
      setError(result.error ?? "Failed to remove member.");
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
      <h2 className="font-serif-display text-2xl text-navy">
        Family Members ({members.length})
      </h2>

      {loading && <p className="mt-4 text-navy/60">Loading...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {!loading && !error && members.length === 0 && (
        <p className="mt-4 text-navy/60">No family members registered yet.</p>
      )}

      <ul className="mt-6 space-y-3">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-gold/15 bg-white/60 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {member.photo_url && (
                <img src={member.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              )}
              <div>
                <p className="font-medium text-navy">
                  {member.full_name_en}
                  {member.full_name_ar && <span className="ml-2 font-arabic text-navy/60">{member.full_name_ar}</span>}
                </p>
                <p className="text-sm text-navy/60">
                  {member.relation && <span className="mr-2">{member.relation}</span>}
                  {member.birth_year && <span className="mr-1">{member.birth_year}</span>}
                  {member.death_year && <span>– {member.death_year}</span>}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-50 hover:text-red-700"
              onClick={() => removeMember(member.id, member.email)}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
