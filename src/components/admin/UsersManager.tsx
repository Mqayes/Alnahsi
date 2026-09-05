import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteByMagicLink } from "@/lib/api/invite-client";

export const PERMS = [
  { key: "manage_members", ar: "إدارة أفراد العائلة والشجرة" },
  { key: "manage_news", ar: "إدارة الأخبار والمناسبات" },
  { key: "manage_gallery", ar: "إدارة الأرشيف والصور" },
  { key: "approve_requests", ar: "اعتماد طلبات الانضمام" },
  { key: "manage_content", ar: "تعديل محتوى الموقع" },
] as const;
type PermKey = (typeof PERMS)[number]["key"];
type Role = "owner" | "admin" | "moderator" | "member";
type Status = "active" | "suspended";
type P = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  status: Status | null;
  permissions: PermKey[] | null;
  member_id: string | null;
  created_at: string;
};
type M = { id: string; full_name_ar: string | null; full_name_en: string };

const ROLE_LABEL: Record<Role, string> = {
  owner: "المالك",
  admin: "أدمن",
  moderator: "مشرف",
  member: "عضو",
};
const I =
  "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold disabled:opacity-50";

export function UsersManager({ me }: { me: { id: string; role: string } }) {
  const [rows, setRows] = useState<P[]>([]);
  const [members, setMembers] = useState<M[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "staff" | "suspended">("all");
  const [inviteEmail, setInviteEmail] = useState("");
  const isOwner = me.role === "owner";

  const load = async () => {
    setLoading(true);
    setErr(null);
    const sb = getSupabase();
    const [p, m] = await Promise.all([
      sb
        .from("profiles")
        .select("id, email, full_name, role, status, permissions, member_id, created_at")
        .order("created_at"),
      sb.from("family_members").select("id, full_name_ar, full_name_en").order("full_name_ar"),
    ]);
    if (p.error) setErr(p.error.message);
    else setRows((p.data ?? []) as P[]);
    setMembers((m.data ?? []) as M[]);
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, []);

  const memberName = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.full_name_ar || m.full_name_en])),
    [members],
  );

  const save = async (p: P, patch: Partial<P>) => {
    setErr(null);
    setMsg(null);
    const { error } = await getSupabase().from("profiles").update(patch).eq("id", p.id);
    if (error) {
      setErr("تعذّر الحفظ: " + error.message);
      return;
    }
    setRows((r) => r.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
    setMsg("تم الحفظ ✓");
  };
  const togglePerm = (p: P, k: PermKey) => {
    const cur = new Set(p.permissions ?? []);
    if (cur.has(k)) cur.delete(k);
    else cur.add(k);
    void save(p, { permissions: Array.from(cur) as PermKey[] });
  };
  const canEdit = (p: P) =>
    p.id !== me.id && p.role !== "owner" && !(p.role === "admin" && !isOwner);

  const [pwFor, setPwFor] = useState<P | null>(null);
  const [pw, setPw] = useState("");
  const setPassword = async () => {
    if (!pwFor) return;
    if (pw.length < 6) {
      setErr("كلمة المرور 6 أحرف على الأقل");
      return;
    }
    setErr(null);
    setMsg(null);
    const { error } = await getSupabase().rpc("admin_set_password", {
      target: pwFor.id,
      new_password: pw,
    });
    if (error) {
      setErr("تعذّر التعيين: " + error.message);
      return;
    }
    setMsg(`تم تعيين كلمة مرور لـ ${pwFor.full_name || pwFor.email} ✓`);
    setPwFor(null);
    setPw("");
  };
  const sendReset = async (email: string) => {
    setErr(null);
    setMsg(null);
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal`,
    });
    if (error) setErr(error.message);
    else setMsg("أُرسل رابط استعادة كلمة المرور إلى " + email);
  };

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    const r = await inviteByMagicLink(inviteEmail.trim());
    if (r.success) {
      setMsg(`أُرسل رابط الدخول إلى ${inviteEmail}`);
      setInviteEmail("");
    } else setErr(r.error);
  };

  const filtered = rows.filter((r) => {
    const t = !q || (r.email ?? "").includes(q) || (r.full_name ?? "").includes(q);
    const f =
      filter === "all" ||
      (filter === "staff" && r.role !== "member") ||
      (filter === "suspended" && r.status === "suspended");
    return t && f;
  });

  return (
    <div dir="rtl" className="space-y-5">
      <div className="premium-card p-5">
        <h3 className="font-arabic text-xl text-navy">الحسابات والصلاحيات</h3>
        <p className="mt-1 text-sm text-navy/60">
          تحكم بالحسابات: تفعيل/إيقاف، الدور، الصلاحيات، وربط الحساب بفرد في الشجرة.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input
            dir="ltr"
            placeholder="email@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={() => void invite()} className="bg-gold text-navy hover:bg-gold/90">
            ＋ دعوة حساب جديد
          </Button>
          <span className="text-xs text-navy/50">
            يصل للمدعو رابط دخول، ويُنشأ حسابه كعضو تلقائياً.
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="بحث بالبريد أو الاسم…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        {(["all", "staff", "suspended"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs ${filter === f ? "border-gold bg-gold/15 text-navy" : "border-gold/30 text-navy/60"}`}
          >
            {f === "all"
              ? `الكل (${rows.length})`
              : f === "staff"
                ? "الإدارة والمشرفون"
                : "الموقوفون"}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => void load()}>
          تحديث
        </Button>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      {loading ? (
        <p className="text-navy/60">جارٍ التحميل…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => {
            const suspended = p.status === "suspended";
            return (
              <div key={p.id} className={`premium-card p-5 ${suspended ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-arabic text-lg text-navy">
                      {p.full_name || p.email || "—"}
                    </div>
                    <div className="truncate text-xs text-navy/50" dir="ltr">
                      {p.email}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.id === me.id && (
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] text-gold">
                          أنت
                        </span>
                      )}
                      {suspended && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-700">
                          موقوف
                        </span>
                      )}
                      {p.member_id && (
                        <span className="rounded-full bg-[#1F5C4F]/10 px-2 py-0.5 text-[11px] text-[#1F5C4F]">
                          مرتبط: {memberName[p.member_id] ?? "—"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${p.role === "owner" ? "bg-navy text-gold" : p.role === "admin" ? "bg-gold text-navy" : p.role === "moderator" ? "bg-[#1F5C4F] text-white" : "bg-navy/10 text-navy"}`}
                  >
                    {ROLE_LABEL[p.role] ?? p.role}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-navy/60">
                    الدور
                    <select
                      disabled={!canEdit(p)}
                      value={p.role}
                      onChange={(e) => void save(p, { role: e.target.value as Role })}
                      className={I}
                    >
                      <option value="member">عضو</option>
                      <option value="moderator">مشرف</option>
                      {(isOwner || p.role === "admin") && <option value="admin">أدمن</option>}
                      {p.role === "owner" && <option value="owner">المالك</option>}
                    </select>
                  </label>
                  <label className="text-xs text-navy/60">
                    الفرد في الشجرة
                    <select
                      disabled={!canEdit(p) && p.id !== me.id}
                      value={p.member_id ?? ""}
                      onChange={(e) => void save(p, { member_id: e.target.value || null })}
                      className={I}
                    >
                      <option value="">— غير مرتبط —</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name_ar || m.full_name_en}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="mt-3 block text-xs text-navy/60">
                  الاسم الظاهر
                  <input
                    disabled={!canEdit(p) && p.id !== me.id}
                    defaultValue={p.full_name ?? ""}
                    onBlur={(e) =>
                      e.target.value !== (p.full_name ?? "") &&
                      void save(p, { full_name: e.target.value })
                    }
                    className={I}
                  />
                </label>

                {p.role === "moderator" && (
                  <div className="mt-3">
                    <div className="text-xs text-navy/60">صلاحيات المشرف</div>
                    <div className="mt-1 grid gap-1">
                      {PERMS.map((k) => (
                        <label key={k.key} className="flex items-center gap-2 text-sm text-navy">
                          <input
                            type="checkbox"
                            disabled={!canEdit(p)}
                            checked={(p.permissions ?? []).includes(k.key)}
                            onChange={() => togglePerm(p, k.key)}
                            className="h-4 w-4 accent-[#CFA93A]"
                          />
                          {k.ar}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {canEdit(p) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className={suspended ? "text-green-700" : "text-red-600"}
                      onClick={() => void save(p, { status: suspended ? "active" : "suspended" })}
                    >
                      {suspended ? "تفعيل الحساب" : "إيقاف الحساب"}
                    </Button>
                  )}
                  {p.email && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const r = await inviteByMagicLink(p.email!);
                        if (r.success) setMsg("أُرسل رابط دخول إلى " + p.email);
                        else setErr(r.error);
                      }}
                    >
                      إرسال رابط دخول
                    </Button>
                  )}
                  {p.email && (
                    <Button size="sm" variant="outline" onClick={() => void sendReset(p.email!)}>
                      رابط استعادة كلمة المرور
                    </Button>
                  )}
                  {(isOwner || me.role === "admin") && p.role !== "owner" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[#1F5C4F]"
                      onClick={() => {
                        setPwFor(p);
                        setPw("");
                      }}
                    >
                      🔑 تعيين كلمة مرور
                    </Button>
                  )}
                </div>
                <div className="mt-3 text-[11px] text-navy/40">
                  انضم: {new Date(p.created_at).toLocaleDateString("ar-SA")}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-navy/50">لا توجد حسابات مطابقة</p>}
        </div>
      )}

      {pwFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4"
          onClick={() => setPwFor(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <h3 className="font-arabic text-xl text-navy">تعيين كلمة مرور</h3>
            <p className="mt-1 text-sm text-navy/60">{pwFor.full_name || pwFor.email}</p>
            <input
              className={I + " mt-4"}
              type="text"
              dir="ltr"
              placeholder="كلمة المرور الجديدة (6+ أحرف)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <p className="mt-2 text-xs text-navy/50">
              أبلغ العضو بكلمة المرور بطريقة آمنة (واتساب مثلاً). يستطيع تغييرها لاحقاً من "نسيت
              كلمة المرور".
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPwFor(null)}>
                إلغاء
              </Button>
              <Button
                className="bg-gold text-navy hover:bg-gold/90"
                onClick={() => void setPassword()}
              >
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
