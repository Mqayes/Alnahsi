import { useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";

export function SupportModal({
  ar,
  onClose,
  defaultKind = "activation",
}: {
  ar: boolean;
  onClose: () => void;
  defaultKind?: "activation" | "support";
}) {
  const [f, setF] = useState({ kind: defaultKind, name: "", email: "", phone: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.message.trim() || (!f.email.trim() && !f.phone.trim())) return;
    setState("sending");
    setErr("");
    try {
      const sb = getSupabase();
      const {
        data: { session },
      } = await sb.auth.getSession();
      const { error } = await sb.from("support_messages").insert({
        kind: f.kind,
        name: f.name.trim() || null,
        email: f.email.trim() || null,
        phone: f.phone.trim() || null,
        message: f.message.trim(),
        user_id: session?.user.id ?? null,
      });
      if (error) throw error;
      setState("done");
    } catch (x) {
      setErr(x instanceof Error ? x.message : "error");
      setState("error");
    }
  };

  const I =
    "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";
  const L = "mb-1 block text-xs text-navy/60";
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-navy/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir={ar ? "rtl" : "ltr"}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="eyebrow">{ar ? "رسالة عبر الموقع" : "Message via site"}</div>
            <h3 className="mt-1 font-arabic text-2xl text-navy">
              {ar ? "تواصل مع إدارة العائلة" : "Contact the family admin"}
            </h3>
          </div>
          <button onClick={onClose} className="text-2xl text-navy/40 hover:text-navy">
            ✕
          </button>
        </div>
        {state === "done" ? (
          <div className="rounded-md border border-green-300 bg-green-50 p-5 text-center text-green-800">
            {ar ? "✓ وصلتنا رسالتك وسنرد عليك قريباً." : "✓ Received — we will get back to you."}
            <button onClick={onClose} className="btn-gold mt-5 w-full">
              {ar ? "إغلاق" : "Close"}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="flex gap-2">
              {(["activation", "support"] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setF({ ...f, kind: k })}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm ${f.kind === k ? "border-gold bg-gold/15 text-navy" : "border-gold/30 text-navy/60"}`}
                >
                  {k === "activation"
                    ? ar
                      ? "تفعيل حسابي"
                      : "Activate my account"
                    : ar
                      ? "مشكلة / استفسار"
                      : "Issue / question"}
                </button>
              ))}
            </div>
            <div>
              <label className={L}>{ar ? "الاسم" : "Name"}</label>
              <input
                className={I}
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={L}>{ar ? "البريد" : "Email"}</label>
                <input
                  className={I}
                  dir="ltr"
                  type="email"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                />
              </div>
              <div>
                <label className={L}>{ar ? "الجوال" : "Phone"}</label>
                <input
                  className={I}
                  dir="ltr"
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className={L}>{ar ? "الرسالة *" : "Message *"}</label>
              <textarea
                className={I}
                rows={4}
                required
                value={f.message}
                onChange={(e) => setF({ ...f, message: e.target.value })}
                placeholder={
                  f.kind === "activation"
                    ? ar
                      ? "سجّلت بالبريد … أرجو تفعيل حسابي"
                      : "I registered with … please activate"
                    : ""
                }
              />
            </div>
            <p className="text-xs text-navy/50">
              {ar
                ? "أدخل البريد أو الجوال لنتمكن من الرد عليك."
                : "Provide email or phone so we can reply."}
            </p>
            {state === "error" && (
              <p className="text-sm text-red-600">
                {ar ? "تعذّر الإرسال: " : "Failed: "}
                {err}
              </p>
            )}
            <button type="submit" disabled={state === "sending"} className="btn-gold w-full">
              {state === "sending" ? "…" : ar ? "✦ إرسال" : "✦ Send"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
