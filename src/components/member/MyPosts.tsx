import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { EVENT_TYPES, type EventType } from "@/lib/events";

type Post = {
  id: string;
  title_ar: string;
  content_ar: string;
  category: string | null;
  status: string;
  is_private: boolean;
  created_at: string;
};
const I =
  "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";
const L = "block text-xs text-navy/60 mb-1";

export function MyPosts({ ar }: { ar: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [f, setF] = useState({
    title: "",
    body: "",
    category: "general" as EventType,
    isPrivate: true,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const sb = getSupabase();
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session) return;
    const { data } = await sb
      .from("news_posts")
      .select("id, title_ar, content_ar, category, status, is_private, created_at")
      .eq("author_id", session.user.id)
      .order("created_at", { ascending: false });
    setPosts((data ?? []) as Post[]);
  };
  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    if (!f.title.trim() || !f.body.trim()) {
      setErr(ar ? "العنوان والنص مطلوبان" : "Title and text required");
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    const sb = getSupabase();
    const {
      data: { session },
    } = await sb.auth.getSession();
    const { error } = await sb.from("news_posts").insert({
      title_ar: f.title.trim(),
      title_en: f.title.trim(),
      content_ar: f.body.trim(),
      content_en: f.body.trim(),
      category: f.category,
      is_private: f.isPrivate,
      status: "pending",
      author_id: session?.user.id,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg(ar ? "أُرسلت مشاركتك وستُنشر بعد اعتماد المشرف ✓" : "Submitted for review ✓");
    setF({ title: "", body: "", category: "general", isPrivate: true });
    void load();
  };

  const remove = async (id: string) => {
    if (!window.confirm(ar ? "حذف المشاركة؟" : "Delete post?")) return;
    const { error } = await getSupabase().from("news_posts").delete().eq("id", id);
    if (error) setErr(error.message);
    else void load();
  };

  return (
    <div className="space-y-5" dir={ar ? "rtl" : "ltr"}>
      <div className="premium-card space-y-3 p-6">
        <h3 className="font-arabic text-xl text-navy">{ar ? "✎ مشاركة جديدة" : "✎ New post"}</h3>
        <p className="text-sm text-navy/60">
          {ar
            ? "شارك خبراً أو مناسبة أو تهنئة — تُنشر في صفحة الأخبار بعد اعتماد المشرف."
            : "Share news or an occasion — published after admin review."}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={L}>{ar ? "العنوان *" : "Title *"}</label>
            <input
              className={I}
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
            />
          </div>
          <div>
            <label className={L}>{ar ? "النوع" : "Type"}</label>
            <select
              className={I}
              value={f.category}
              onChange={(e) => setF({ ...f, category: e.target.value as EventType })}
            >
              {(Object.keys(EVENT_TYPES) as EventType[]).map((k) => (
                <option key={k} value={k}>
                  {EVENT_TYPES[k].icon} {ar ? EVENT_TYPES[k].ar : EVENT_TYPES[k].en}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={L}>{ar ? "النص *" : "Text *"}</label>
          <textarea
            className={I}
            rows={4}
            value={f.body}
            onChange={(e) => setF({ ...f, body: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#CFA93A]"
            checked={f.isPrivate}
            onChange={(e) => setF({ ...f, isPrivate: e.target.checked })}
          />
          {ar ? "للأعضاء فقط (لا يظهر للزوار)" : "Members only"}
        </label>
        <div className="flex items-center gap-3">
          <Button
            disabled={busy}
            onClick={() => void submit()}
            className="bg-gold text-navy hover:bg-gold/90"
          >
            {busy ? "…" : ar ? "إرسال للنشر" : "Submit"}
          </Button>
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </div>

      <div className="premium-card p-6">
        <h3 className="font-arabic text-lg text-navy">{ar ? "مشاركاتي" : "My posts"}</h3>
        {posts.length === 0 ? (
          <p className="mt-2 text-sm text-navy/50">{ar ? "لا توجد مشاركات بعد" : "No posts yet"}</p>
        ) : (
          <ul className="mt-3 divide-y divide-gold/15">
            {posts.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="font-arabic text-navy">
                    {p.category && EVENT_TYPES[p.category as EventType]?.icon} {p.title_ar}
                  </div>
                  <div className="text-xs text-navy/50">
                    {new Date(p.created_at).toLocaleDateString(ar ? "ar-SA" : "en-GB")}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${p.status === "published" ? "bg-green-100 text-green-700" : p.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}
                  >
                    {p.status === "published"
                      ? ar
                        ? "منشور"
                        : "Published"
                      : p.status === "rejected"
                        ? ar
                          ? "مرفوض"
                          : "Rejected"
                        : ar
                          ? "بانتظار الاعتماد"
                          : "Pending"}
                  </span>
                  <button
                    onClick={() => void remove(p.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    {ar ? "حذف" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
