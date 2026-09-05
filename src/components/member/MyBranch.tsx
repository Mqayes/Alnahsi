import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { composeFullName, type LineageRow } from "@/lib/lineage";

type M = LineageRow & {
  birth_year: number | null;
  is_deceased: boolean | null;
  city: string | null;
};
type Req = {
  id: string;
  full_name_ar: string | null;
  full_name_en: string;
  status: string;
  created_at: string;
  event_kind: string | null;
};
const I =
  "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";
const L = "block text-xs text-navy/60 mb-1";

export function MyBranch({ ar }: { ar: boolean }) {
  const [meId, setMeId] = useState<string | null>(null);
  const [myMember, setMyMember] = useState<string | null>(null);
  const [rows, setRows] = useState<M[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [f, setF] = useState({
    first: "",
    gender: "m" as "m" | "f",
    birth: "",
    deceased: false,
    death: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const sb = getSupabase();
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session) return;
    setMeId(session.user.id);
    const [{ data: p }, { data: all }, { data: r }] = await Promise.all([
      sb.from("profiles").select("member_id").eq("id", session.user.id).maybeSingle(),
      sb
        .from("family_members")
        .select(
          "id, full_name_ar, full_name_en, first_name, parent_id, generation, gender, birth_year, is_deceased, city",
        ),
      sb
        .from("join_requests")
        .select("id, full_name_ar, full_name_en, status, created_at, event_kind")
        .eq("requested_by", session.user.id)
        .order("created_at", { ascending: false }),
    ]);
    setMyMember(p?.member_id ?? null);
    setRows((all ?? []) as M[]);
    setReqs((r ?? []) as Req[]);
  };
  useEffect(() => {
    void load();
  }, []);

  const byId = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.id, r])) as Record<string, LineageRow>,
    [rows],
  );
  const name = (r: LineageRow) => r.full_name_ar || r.full_name_en;
  const children = rows.filter((r) => r.parent_id === myMember);
  const me = myMember ? rows.find((r) => r.id === myMember) : undefined;

  const submit = async () => {
    if (!myMember || !meId) return;
    if (!f.first.trim() || !f.birth) {
      setErr(ar ? "الاسم وسنة الميلاد مطلوبان" : "Name and birth year required");
      return;
    }
    setErr(null);
    setMsg(null);
    const full = composeFullName(f.first, f.gender, myMember, byId);
    const { error } = await getSupabase()
      .from("join_requests")
      .insert({
        full_name_en: full,
        full_name_ar: full,
        first_name: f.first.trim(),
        parent_id: myMember,
        gender: f.gender,
        birth_year: Number(f.birth),
        is_deceased: f.deceased,
        death_year: f.deceased && f.death ? Number(f.death) : null,
        status: "pending",
        requested_by: meId,
        event_kind: "child",
        message: ar ? "إضافة من لوحة العضو" : "Added from member portal",
      });
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg(ar ? `أُرسل طلب إضافة «${full}» وسيُعتمد من المشرف ✓` : "Request sent for approval ✓");
    setF({ first: "", gender: "m", birth: "", deceased: false, death: "" });
    void load();
  };

  if (!myMember)
    return (
      <div className="premium-card p-6 text-navy/60" dir={ar ? "rtl" : "ltr"}>
        {ar
          ? "اربط حسابك باسمك من تبويب «ملفي» أولاً."
          : "Link your account first from “My profile”."}
      </div>
    );

  return (
    <div className="space-y-5" dir={ar ? "rtl" : "ltr"}>
      <div className="premium-card p-6">
        <h3 className="font-arabic text-xl text-navy">{ar ? "فرعي في الشجرة" : "My branch"}</h3>
        <p className="mt-1 text-sm text-navy/60">
          {me ? name(me) : ""}
          {me?.generation ? ` · ${ar ? "الجيل" : "Gen"} ${me.generation}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {children.length === 0 && (
            <span className="text-sm text-navy/50">
              {ar ? "لا يوجد أبناء مسجّلون بعد" : "No children yet"}
            </span>
          )}
          {children.map((c) => (
            <span
              key={c.id}
              className={`rounded-full border px-3 py-1 font-arabic text-sm ${c.is_deceased ? "border-navy/20 bg-navy/5 text-navy/60" : "border-gold/40 bg-parchment text-navy"}`}
            >
              {c.gender === "f" ? "♀ " : ""}
              {c.first_name || name(c)}
              {c.birth_year ? ` · ${c.birth_year}` : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="premium-card space-y-3 p-6">
        <h3 className="font-arabic text-lg text-navy">
          {ar ? "＋ أضف ابناً / ابنة" : "＋ Add a child"}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="col-span-2">
            <label className={L}>{ar ? "الاسم الأول *" : "First name *"}</label>
            <input
              className={I}
              value={f.first}
              onChange={(e) => setF({ ...f, first: e.target.value })}
            />
          </div>
          <div>
            <label className={L}>{ar ? "الجنس" : "Gender"}</label>
            <select
              className={I}
              value={f.gender}
              onChange={(e) => setF({ ...f, gender: e.target.value as "m" | "f" })}
            >
              <option value="m">{ar ? "ذكر" : "Male"}</option>
              <option value="f">{ar ? "أنثى" : "Female"}</option>
            </select>
          </div>
          <div>
            <label className={L}>{ar ? "سنة الميلاد *" : "Birth year *"}</label>
            <input
              className={I}
              type="number"
              value={f.birth}
              onChange={(e) => setF({ ...f, birth: e.target.value })}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#CFA93A]"
            checked={f.deceased}
            onChange={(e) => setF({ ...f, deceased: e.target.checked })}
          />
          {ar ? "متوفى" : "Deceased"}
        </label>
        {f.deceased && (
          <div className="max-w-xs">
            <label className={L}>{ar ? "سنة الوفاة" : "Death year"}</label>
            <input
              className={I}
              type="number"
              value={f.death}
              onChange={(e) => setF({ ...f, death: e.target.value })}
            />
          </div>
        )}
        {f.first.trim() && (
          <p className="text-sm text-navy/70">
            {ar ? "الاسم الكامل: " : "Full name: "}
            <b className="font-arabic text-navy">
              {composeFullName(f.first, f.gender, myMember, byId)}
            </b>
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button onClick={() => void submit()} className="bg-gold text-navy hover:bg-gold/90">
            {ar ? "إرسال للاعتماد" : "Submit for approval"}
          </Button>
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </div>

      {reqs.length > 0 && (
        <div className="premium-card p-6">
          <h3 className="font-arabic text-lg text-navy">{ar ? "طلباتي" : "My requests"}</h3>
          <ul className="mt-3 divide-y divide-gold/15 text-sm">
            {reqs.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <span className="font-arabic text-navy">{r.full_name_ar || r.full_name_en}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${r.status === "pending" ? "bg-amber-100 text-amber-800" : r.status === "approved" ? "bg-green-100 text-green-700" : "bg-navy/10 text-navy"}`}
                >
                  {r.status === "pending"
                    ? ar
                      ? "بانتظار الاعتماد"
                      : "Pending"
                    : r.status === "approved"
                      ? ar
                        ? "معتمد"
                        : "Approved"
                      : ar
                        ? "مرفوض"
                        : "Rejected"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
