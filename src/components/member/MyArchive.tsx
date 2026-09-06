import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Vis = "private" | "custom" | "family" | "public";
type F = {
  id: string;
  title: string | null;
  path: string;
  mime: string | null;
  size_kb: number | null;
  visibility: Vis;
  created_at: string;
  member_id: string;
};
const VIS: { v: Vis; ar: string; icon: string }[] = [
  { v: "private", ar: "خاص بي", icon: "🔒" },
  { v: "custom", ar: "أشخاص محددون", icon: "👥" },
  { v: "family", ar: "العائلة", icon: "🏡" },
  { v: "public", ar: "العامة", icon: "🌍" },
];

export function MyArchive({ ar }: { ar: boolean }) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [files, setFiles] = useState<F[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [vis, setVis] = useState<Vis>("family");

  const load = async () => {
    const sb = getSupabase();
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session) return;
    const { data: p } = await sb
      .from("profiles")
      .select("member_id")
      .eq("id", session.user.id)
      .maybeSingle();
    setMemberId(p?.member_id ?? null);
    if (!p?.member_id) return;
    const { data } = await sb
      .from("member_files")
      .select("*")
      .eq("member_id", p.member_id)
      .order("created_at", { ascending: false });
    const list = (data ?? []) as F[];
    setFiles(list);
    const map: Record<string, string> = {};
    for (const f of list) {
      const { data: signed } = await sb.storage.from("member-files").createSignedUrl(f.path, 3600);
      if (signed?.signedUrl) map[f.id] = signed.signedUrl;
    }
    setUrls(map);
  };
  useEffect(() => {
    void load();
  }, []);

  const upload = async (file: File) => {
    if (!memberId) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    const sb = getSupabase();
    const {
      data: { session },
    } = await sb.auth.getSession();
    const path = `${memberId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const up = await sb.storage.from("member-files").upload(path, file);
    if (up.error) {
      setErr(up.error.message);
      setBusy(false);
      return;
    }
    const { error } = await sb.from("member_files").insert({
      member_id: memberId,
      owner_id: session?.user.id,
      title: file.name,
      path,
      mime: file.type,
      size_kb: Math.round(file.size / 1024),
      visibility: vis,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else {
      setMsg(ar ? "تم الرفع ✓" : "Uploaded ✓");
      void load();
    }
  };

  const setFileVis = async (f: F, v: Vis) => {
    const { error } = await getSupabase()
      .from("member_files")
      .update({ visibility: v })
      .eq("id", f.id);
    if (error) setErr(error.message);
    else setFiles((l) => l.map((x) => (x.id === f.id ? { ...x, visibility: v } : x)));
  };
  const remove = async (f: F) => {
    if (!window.confirm(ar ? "حذف الملف؟" : "Delete file?")) return;
    await getSupabase().storage.from("member-files").remove([f.path]);
    const { error } = await getSupabase().from("member_files").delete().eq("id", f.id);
    if (error) setErr(error.message);
    else void load();
  };

  if (!memberId)
    return (
      <div className="premium-card p-6 text-navy/60" dir={ar ? "rtl" : "ltr"}>
        {ar ? "اربط حسابك باسمك من تبويب «ملفي» أولاً." : "Link your account first."}
      </div>
    );

  return (
    <div dir={ar ? "rtl" : "ltr"} className="space-y-5">
      <div className="premium-card p-5">
        <h3 className="font-arabic text-xl text-navy">{ar ? "أرشيفي الخاص" : "My archive"}</h3>
        <p className="mt-1 text-sm text-navy/60">
          {ar
            ? "صورك ووثائقك — أنت تحدد من يراها لكل ملف على حدة."
            : "Your photos and documents — you set who sees each file."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={vis}
            onChange={(e) => setVis(e.target.value as Vis)}
            className="rounded-md border border-gold/40 bg-parchment px-3 py-2 text-sm text-navy"
          >
            {VIS.map((v) => (
              <option key={v.v} value={v.v}>
                {v.icon} {ar ? `يُرفع كـ: ${v.ar}` : v.v}
              </option>
            ))}
          </select>
          <label className="cursor-pointer rounded-md bg-gold px-4 py-2 text-sm font-bold text-navy hover:brightness-105">
            {busy ? "…" : ar ? "⬆ رفع ملف / صورة" : "⬆ Upload"}
            <input
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])}
            />
          </label>
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-navy/50">{ar ? "لا توجد ملفات بعد" : "No files yet"}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => (
            <div key={f.id} className="premium-card overflow-hidden">
              <div className="aspect-[4/3] bg-parchment">
                {f.mime?.startsWith("image/") && urls[f.id] ? (
                  <img
                    src={urls[f.id]}
                    alt={f.title ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">📄</div>
                )}
              </div>
              <div className="p-3">
                <div className="truncate text-sm text-navy">{f.title}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {VIS.map((v) => (
                    <button
                      key={v.v}
                      onClick={() => void setFileVis(f, v.v)}
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${f.visibility === v.v ? "border-gold bg-gold/20 text-navy" : "border-gold/25 text-navy/50"}`}
                    >
                      {v.icon} {v.ar}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  {urls[f.id] && (
                    <a
                      href={urls[f.id]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold hover:underline"
                    >
                      {ar ? "فتح" : "Open"}
                    </a>
                  )}
                  <button onClick={() => void remove(f)} className="text-red-600 hover:underline">
                    {ar ? "حذف" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
