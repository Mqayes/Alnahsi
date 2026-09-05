import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MESSAGE_TOPICS,
  fetchMessages,
  replyToMessage,
  setMessageStatus,
  type MemberMessage,
} from "@/lib/occasions";

const STATUS: Record<MemberMessage["status"], { text: string; cls: string }> = {
  new: { text: "جديدة", cls: "bg-amber-100 text-amber-800" },
  read: { text: "مقروءة", cls: "bg-navy/10 text-navy/70" },
  replied: { text: "تم الرد", cls: "bg-emerald-100 text-emerald-800" },
  closed: { text: "مغلقة", cls: "bg-navy/10 text-navy/50" },
};

function topicLabel(id: string): string {
  return MESSAGE_TOPICS.find((t) => t.id === id)?.label ?? "استفسار";
}

function when(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

export function InboxTab() {
  const [items, setItems] = useState<MemberMessage[]>([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    const res = await fetchMessages();
    setItems(res.items);
    setNeedsMigration(res.needsMigration);
    setErr(res.error ?? "");
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 3000);
  };

  const reply = async (m: MemberMessage) => {
    const text = (drafts[m.id] ?? "").trim();
    if (!text) {
      setErr("اكتب نص الرد.");
      return;
    }
    setBusy(true);
    setErr("");
    const e = await replyToMessage(m.id, text);
    setBusy(false);
    if (e) setErr(e);
    else {
      setDrafts((d) => ({ ...d, [m.id]: "" }));
      flash("أُرسل الرد — يراه العضو في «مساحتي ← مراسلة الإدارة».");
      void reload();
    }
  };

  const mark = async (m: MemberMessage, status: MemberMessage["status"]) => {
    setBusy(true);
    const e = await setMessageStatus(m.id, status);
    setBusy(false);
    if (e) setErr(e);
    else void reload();
  };

  const shown = filter === "open" ? items.filter((m) => m.status !== "closed") : items;
  const unread = items.filter((m) => m.status === "new").length;

  return (
    <div dir="rtl" className="space-y-5">
      <div className="premium-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h3 className="font-arabic text-xl text-navy">
            صندوق رسائل الأعضاء
            {unread > 0 && (
              <span className="mr-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                {unread} جديدة
              </span>
            )}
          </h3>
          <p className="mt-1 text-sm text-navy/60">
            ما يرسله أفراد العائلة من استفسارات وتصحيحات وبلاغات.
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { id: "open" as const, label: "المفتوحة" },
            { id: "all" as const, label: "الكل" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                filter === f.id
                  ? "border-gold bg-gold font-semibold text-navy"
                  : "border-gold/30 bg-white text-navy/70 hover:bg-parchment"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {needsMigration && (
        <div className="premium-card border-amber-400 p-5">
          <p className="font-arabic text-navy">المراسلة غير مفعّلة بعد.</p>
          <p className="mt-2 text-sm text-navy/70">
            طبّق ترقية «مناسبات وإعلانات الأعضاء + مراسلة الإدارة» من بطاقة قاعدة البيانات أعلى
            الصفحة.
          </p>
        </div>
      )}

      {msg && (
        <p className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm text-navy">
          {msg}
        </p>
      )}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {shown.length === 0 && !needsMigration && <p className="text-sm text-navy/60">لا رسائل.</p>}

      <div className="space-y-4">
        {shown.map((m) => {
          const s = STATUS[m.status];
          return (
            <div key={m.id} className="premium-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.text}</span>
                <span className="rounded-full bg-navy/5 px-2 py-0.5 text-xs text-navy/70">
                  {topicLabel(m.topic)}
                </span>
                <h4 className="font-arabic text-base text-navy">{m.subject}</h4>
              </div>

              <p className="mt-1 text-xs text-navy/50">
                {m.sender_name ?? "عضو"}
                {m.sender_email ? ` · ${m.sender_email}` : ""} · {when(m.created_at)}
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-navy/80">
                {m.body}
              </p>

              {m.admin_reply && (
                <div className="mt-4 rounded-lg border-r-4 border-gold bg-parchment p-4">
                  <p className="text-xs font-semibold text-navy">الرد المرسل</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-navy/80">{m.admin_reply}</p>
                </div>
              )}

              {m.status !== "closed" && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={drafts[m.id] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                    rows={3}
                    placeholder={m.admin_reply ? "رد إضافي…" : "اكتب ردك على العضو…"}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => void reply(m)} disabled={busy}>
                      إرسال الرد
                    </Button>
                    {m.status === "new" && (
                      <Button
                        variant="outline"
                        onClick={() => void mark(m, "read")}
                        disabled={busy}
                      >
                        تعليم كمقروءة
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => void mark(m, "closed")}
                      disabled={busy}
                    >
                      إغلاق
                    </Button>
                  </div>
                </div>
              )}

              {m.status === "closed" && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => void mark(m, "read")}
                  disabled={busy}
                >
                  إعادة فتح
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
