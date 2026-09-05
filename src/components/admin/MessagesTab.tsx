import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Msg = {
  id: string;
  created_at: string;
  kind: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string;
  status: string;
  note: string | null;
  user_id: string | null;
};

export function MessagesTab({ ar }: { ar: boolean }) {
  const [rows, setRows] = useState<Msg[]>([]);
  const [filter, setFilter] = useState<"new" | "all">("new");
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    let q = getSupabase()
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter === "new") q = q.eq("status", "new");
    const { data, error } = await q;
    if (error) setErr(error.message);
    else setRows((data ?? []) as Msg[]);
  };
  useEffect(() => {
    void load();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = async (id: string, status: string) => {
    const {
      data: { session },
    } = await getSupabase().auth.getSession();
    const { error } = await getSupabase()
      .from("support_messages")
      .update({ status, handled_by: session?.user.id, handled_at: new Date().toISOString() })
      .eq("id", id);
    if (error) setErr(error.message);
    else void load();
  };
  const wa = (p: string | null) => {
    const d = (p ?? "").replace(/\D/g, "");
    return d ? `https://wa.me/${d.startsWith("0") ? "966" + d.slice(1) : d}` : "";
  };

  return (
    <div dir={ar ? "rtl" : "ltr"} className="space-y-4">
      <div className="premium-card p-5">
        <h3 className="font-arabic text-xl text-navy">{ar ? "الرسائل" : "Messages"}</h3>
        <p className="mt-1 text-sm text-navy/60">
          {ar
            ? "طلبات التفعيل والاستفسارات المرسلة عبر الموقع."
            : "Activation requests and support messages sent via the site."}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setFilter("new")}
            className={`rounded-full border px-3 py-1 text-xs ${filter === "new" ? "border-gold bg-gold text-navy" : "border-gold/30 text-navy/60"}`}
          >
            {ar ? "الجديدة" : "New"}
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full border px-3 py-1 text-xs ${filter === "all" ? "border-gold bg-gold text-navy" : "border-gold/30 text-navy/60"}`}
          >
            {ar ? "الكل" : "All"}
          </button>
          <Button size="sm" variant="outline" onClick={() => void load()}>
            {ar ? "تحديث" : "Refresh"}
          </Button>
        </div>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.length === 0 && (
          <p className="text-sm text-navy/50">{ar ? "لا توجد رسائل" : "No messages"}</p>
        )}
        {rows.map((r) => (
          <div key={r.id} className={`premium-card p-4 ${r.status !== "new" ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2 py-0.5 ${r.kind === "activation" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"}`}
              >
                {r.kind === "activation"
                  ? ar
                    ? "تفعيل حساب"
                    : "Activation"
                  : ar
                    ? "دعم"
                    : "Support"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 ${r.status === "new" ? "bg-amber-100 text-amber-800" : "bg-navy/10 text-navy"}`}
              >
                {r.status === "new" ? (ar ? "جديدة" : "New") : ar ? "تمت المعالجة" : "Handled"}
              </span>
              <span className="text-navy/40" dir="ltr">
                {new Date(r.created_at).toLocaleString(ar ? "ar-SA" : "en-GB")}
              </span>
            </div>
            <div className="mt-2 font-arabic text-navy">{r.name || "—"}</div>
            <div className="text-xs text-navy/60" dir="ltr">
              {[r.email, r.phone].filter(Boolean).join(" · ")}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-navy/80">{r.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.email && (
                <a
                  className="rounded-md border border-gold/40 px-3 py-1 text-xs text-navy hover:bg-parchment"
                  href={`mailto:${r.email}`}
                >
                  {ar ? "رد بالبريد" : "Reply by email"}
                </a>
              )}
              {wa(r.phone) && (
                <a
                  className="rounded-md border border-gold/40 px-3 py-1 text-xs text-navy hover:bg-parchment"
                  href={wa(r.phone)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {ar ? "رد بواتساب" : "Reply on WhatsApp"}
                </a>
              )}
              {r.status === "new" ? (
                <Button
                  size="sm"
                  className="bg-gold text-navy hover:bg-gold/90"
                  onClick={() => void setStatus(r.id, "handled")}
                >
                  {ar ? "✓ تمت المعالجة" : "✓ Mark handled"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => void setStatus(r.id, "new")}>
                  {ar ? "إعادة فتح" : "Reopen"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
