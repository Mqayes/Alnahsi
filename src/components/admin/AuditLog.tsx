import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Row = {
  id: number;
  at: string;
  actor_email: string | null;
  table_name: string;
  row_id: string | null;
  action: string;
  summary: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
};
const TABLE_AR: Record<string, string> = {
  family_members: "الشجرة",
  news_posts: "الأخبار",
  profiles: "الحسابات",
  join_requests: "الطلبات",
  site_content: "المحتوى",
};
const ACTION: Record<string, { ar: string; en: string; cls: string }> = {
  INSERT: { ar: "إضافة", en: "Added", cls: "bg-green-100 text-green-700" },
  UPDATE: { ar: "تعديل", en: "Updated", cls: "bg-amber-100 text-amber-800" },
  DELETE: { ar: "حذف", en: "Deleted", cls: "bg-red-100 text-red-700" },
};
const SKIP = new Set(["updated_at", "created_at", "id"]);

function diff(o: Record<string, unknown> | null, n: Record<string, unknown> | null): string[] {
  if (!o || !n) return [];
  return Object.keys(n)
    .filter((k) => !SKIP.has(k) && JSON.stringify(o[k]) !== JSON.stringify(n[k]))
    .map((k) => `${k}: ${String(o[k] ?? "—")} ← ${String(n[k] ?? "—")}`);
}

export function AuditLog({ ar }: { ar: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [table, setTable] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const load = async () => {
    let q = getSupabase()
      .from("audit_log")
      .select("*")
      .order("at", { ascending: false })
      .limit(200);
    if (table) q = q.eq("table_name", table);
    const { data, error } = await q;
    if (error) setErr(error.message);
    else setRows((data ?? []) as Row[]);
  };
  useEffect(() => {
    void load();
  }, [table]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div dir={ar ? "rtl" : "ltr"} className="space-y-4">
      <div className="premium-card p-5">
        <h3 className="font-arabic text-xl text-navy">{ar ? "سجل التغييرات" : "Change log"}</h3>
        <p className="mt-1 text-sm text-navy/60">
          {ar
            ? "كل إضافة وتعديل وحذف مع التاريخ ومن قام به."
            : "Every add/update/delete with date and actor."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setTable("")}
            className={`rounded-full border px-3 py-1 text-xs ${!table ? "border-gold bg-gold text-navy" : "border-gold/30 text-navy/60"}`}
          >
            {ar ? "الكل" : "All"}
          </button>
          {Object.entries(TABLE_AR).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setTable(k)}
              className={`rounded-full border px-3 py-1 text-xs ${table === k ? "border-gold bg-gold text-navy" : "border-gold/30 text-navy/60"}`}
            >
              {ar ? v : k}
            </button>
          ))}
          <Button size="sm" variant="outline" onClick={() => void load()}>
            {ar ? "تحديث" : "Refresh"}
          </Button>
        </div>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </div>
      <div className="premium-card divide-y divide-gold/15 p-2">
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-navy/50">
            {ar ? "لا توجد سجلات بعد" : "No entries yet"}
          </p>
        )}
        {rows.map((r) => {
          const changes = diff(r.old_data, r.new_data);
          return (
            <div key={r.id} className="px-3 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-navy/40" dir="ltr">
                  {new Date(r.at).toLocaleString(ar ? "ar-SA" : "en-GB")}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${ACTION[r.action]?.cls}`}>
                  {ar ? ACTION[r.action]?.ar : ACTION[r.action]?.en}
                </span>
                <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[11px] text-navy">
                  {ar ? (TABLE_AR[r.table_name] ?? r.table_name) : r.table_name}
                </span>
                <span className="font-arabic text-navy">{r.summary ?? r.row_id}</span>
                <span className="text-xs text-navy/50" dir="ltr">
                  {r.actor_email ?? ""}
                </span>
                {changes.length > 0 && (
                  <button
                    onClick={() => setOpen(open === r.id ? null : r.id)}
                    className="text-xs text-gold hover:underline"
                  >
                    {open === r.id
                      ? ar
                        ? "إخفاء"
                        : "Hide"
                      : ar
                        ? `${changes.length} تغيير`
                        : `${changes.length} changes`}
                  </button>
                )}
              </div>
              {open === r.id && (
                <ul className="mt-2 rounded bg-parchment p-2 text-xs text-navy/70" dir="ltr">
                  {changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
