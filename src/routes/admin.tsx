import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getSupabase,
  isSupabaseConfigured,
  type FamilyMember,
  type JoinRequest,
  type Profile,
} from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Alnahsi Family Portal" }],
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

      const supabase = getSupabase();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (sessionError || !session) {
        setAuth({
          status: "denied",
          message: "You must sign in to access the admin dashboard.",
        });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, email, full_name")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileError) {
        setAuth({
          status: "denied",
          message: `Could not verify your profile: ${profileError.message}`,
        });
        return;
      }

      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        setAuth({
          status: "denied",
          message: "Your account does not have admin access.",
        });
        return;
      }

      setAuth({ status: "authorized", profile: profile as Profile });
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
          <TabsTrigger value="news">Post News</TabsTrigger>
          <TabsTrigger value="members">Add Member</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <JoinRequestsTab />
        </TabsContent>
        <TabsContent value="news" className="mt-6">
          <PostNewsTab />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <AddMemberTab />
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
      .select("id, full_name, email, message, status, created_at")
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
                <p className="font-medium text-navy">{request.full_name}</p>
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

function PostNewsTab() {
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentAr, setContentAr] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage("News post published.");
      setTitleEn("");
      setTitleAr("");
      setContentEn("");
      setContentAr("");
    }

    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
      <h2 className="font-serif-display text-2xl text-navy">Post news</h2>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title-en">Title (English)</Label>
            <Input
              id="title-en"
              required
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
            />
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
            required
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
      full_name: fullName.trim(),
      email: email.trim() || null,
      relationship: relationship.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage("Family member added.");
      setFullName("");
      setEmail("");
      setRelationship("");
    }

    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-gold/20 bg-parchment/50 p-6">
      <h2 className="font-serif-display text-2xl text-navy">Add family member</h2>
      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        <div className="space-y-2">
          <Label htmlFor="member-name">Full name</Label>
          <Input
            id="member-name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-email">Email</Label>
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-relationship">Relationship</Label>
          <Input
            id="member-relationship"
            placeholder="e.g. cousin, aunt, son"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add member"}
        </Button>
      </form>
    </div>
  );
}
