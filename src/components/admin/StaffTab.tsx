import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const PERMS = [
  { key: "manage_members",  ar: "إدارة أفراد العائلة والشجرة", en: "Manage family members & tree" },
  { key: "manage_news",     ar: "إدارة الأخبار والمناسبات",      en: "Manage news & events" },
  { key: "manage_gallery",  ar: "إدارة الأرشيف والصور",          en: "Manage gallery & archive" },
  { key: "approve_requests",ar: "اعتماد طلبات الانضمام",          en: "Approve join requests" },
  { key: "manage_content",  ar: "تعديل محتوى الموقع",             en: "Edit site content" },
] as const;
type PermKey = typeof PERMS[number]["key"];
type Role = "owner" | "admin" | "moderator" | "member";
type P = { id: string; email: string | null; full_name: string | null; role: Role; permissions: PermKey[] | null; created_at: string };

const ROLE_LABEL: Record<Role, string> = { owner: "المالك", admin: "أدمن", moderator: "مشرف", member: "عضو" };

export function StaffTab({ me }: { me: { id: string; role: string } }) {
  const [rows, setRows] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const isOwner = me.role === "owner";

  const load = async () => {
    setLoading(true);
    const { data, error } = await getSupabase().from("profiles").select("id, email, full_name, role, permissions, created_at").order("created_at");
    if (error) setMsg(error.message); else setRows((data ?? []) as P[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const save = async (p: P, patch: Partial<P>) => {
    setMsg(null);
    const { error } = await getSupabase().from("profiles").update(patch).eq("id", p.id);
    if (error) { setMsg("تعذّر الحفظ: " + error.message); return; }
    setRows((r) => r.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
    setMsg("تم الحفظ ✓");
  };

  const togglePerm = (p: P, k: PermKey) => {
    const cur = new Set(p.permissions ?? []);
    cur.has(k) ? cur.delete(k) : cur.add(k);
    void save(p, { permissions: Array.from(cur) as PermKey[] });
  };

  const canEdit = (p: P) => {
    if (p.id === me.id) return false;               // لا تعدّل نفسك
    if (p.role === "owner") return false;            // المالك لا يُمس
    if (p.role === "admin" && !isOwner) return false; // الأدمن لا يعدّل أدمن آخر
    return true;
  };

  const filtered = rows.filter((r) => !q || (r.email ?? "").includes(q) || (r.full_name ?? "").includes(q));

  return (
    <div dir="rtl" className="space-y-5">
      <div className="rounded-lg border border-gold/30 bg-white p-5">
        <h3 className="font-arabic text-xl text-navy">المشرفون والصلاحيات</h3>
        <p className="mt-1 text-sm text-navy/60">
          عيّن دور كل حساب وحدد الصلاحيات التي يملكها. الأدمن يملك كل الصلاحيات، والمشرف يملك ما تحدده له فقط.
        </p>
        <p className="mt-2 text-xs text-navy/50">لإضافة مشرف جديد: أنشئ له حساباً من Supabase → Authentication → Users، ثم عيّن دوره هنا.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="بحث بالبريد أو الاسم…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Button variant="outline" onClick={() => void load()}>تحديث</Button>
        {msg && <span className="text-sm text-navy/70">{msg}</span>}
      </div>

      {loading ? <p className="text-navy/60">جارٍ التحميل…</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-lg border border-gold/25 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-arabic text-lg text-navy">{p.full_name || p.email || "—"}</div>
                  <div className="truncate text-xs text-navy/50" dir="ltr">{p.email}</div>
                  {p.id === me.id && <span className="mt-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[11px] text-gold">أنت</span>}
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  p.role === "owner" ? "bg-navy text-gold" : p.role === "admin" ? "bg-gold text-navy" : p.role === "moderator" ? "bg-[#1F5C4F] text-white" : "bg-navy/10 text-navy"
                }`}>{ROLE_LABEL[p.role] ?? p.role}</span>
              </div>

              <div className="mt-4">
                <label className="text-xs text-navy/60">الدور</label>
                <select
                  disabled={!canEdit(p)}
                  value={p.role}
                  onChange={(e) => void save(p, { role: e.target.value as Role })}
                  className="mt-1 w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy disabled:opacity-50"
                >
                  <option value="member">عضو</option>
                  <option value="moderator">مشرف</option>
                  {isOwner && <option value="admin">أدمن</option>}
                  {p.role === "owner" && <option value="owner">المالك</option>}
                  {p.role === "admin" && !isOwner && <option value="admin">أدمن</option>}
                </select>
              </div>

              {p.role === "moderator" && (
                <div className="mt-4">
                  <div className="text-xs text-navy/60">صلاحيات المشرف</div>
                  <div className="mt-2 space-y-2">
                    {PERMS.map((k) => (
                      <label key={k.key} className="flex items-center gap-2 text-sm text-navy">
                        <input type="checkbox" disabled={!canEdit(p)} checked={(p.permissions ?? []).includes(k.key)} onChange={() => togglePerm(p, k.key)} className="h-4 w-4 accent-[#CFA93A]" />
                        {k.ar}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 text-[11px] text-navy/40">انضم: {new Date(p.created_at).toLocaleDateString("ar-SA")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
