import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGE_TOPICS, fetchMessages, sendMessage, type MemberMessage } from "@/lib/occasions";

type Me = { id: string; name: string | null; email: string | null };

const STATUS_LABEL: Record<MemberMessage["status"], { text: string; cls: string }> = {
  new: { text: "بانتظار القراءة", cls: "bg-amber-100 text-amber-800" },
  read: { text: "قرأتها الإدارة", cls: "bg-navy/10 text-navy/70" },
  replied: { text: "تم الرد", cls: "bg-emerald-100 text-emerald-800" },
  closed: { text: "مغلقة", cls: "bg-navy/10 text-navy/50" },
};

export function ContactAdminTab({
  me,
  onNotice,
  onError,
}: {
  me: Me;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [items, setItems] = useState<MemberMessage[]>([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [topic, setTopic] = useState<string>(MESSAGE_TOPICS[0].id);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetchMessages(me.id);
    setItems(res.items);
    setNeedsMigration(res.needsMigration);
    if (res.error) onError(res.error);
  }, [me.id, onError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      onError("اكتب الموضوع ونص الرسالة.");
      return;
    }
    setBusy(true);
    onError("");
    const err = await sendMessage({ topic, subject, body }, me);
    setBusy(false);
    if (err) {
      onError(err);
      return;
    }
    setSubject("");
    setBody("");
    onNotice("وصلت رسالتك للإدارة.");
    void reload();
  };

  return (
    <div className="space-y-6">
      {needsMigration && (
        <div className="premium-card border-amber-400 p-5">
          <p className="font-arabic text-navy">المراسلة غير مفعّلة بعد.</p>
          <p className="mt-2 text-sm text-navy/70">
            على المالك تطبيق ترقية «مناسبات وإعلانات الأعضاء + مراسلة الإدارة».
          </p>
        </div>
      )}

      <div className="premium-card space-y-4 p-6">
        <div>
          <h2 className="font-arabic text-xl text-navy">راسل الإدارة</h2>
          <p className="mt-1 text-sm text-navy/60">
            تصحيح في الشجرة، مشكلة في حسابك، أو ملاحظة على المحتوى — اكتبها هنا وتصل مباشرة.
          </p>
        </div>

        <div>
          <Label htmlFor="msg-topic">الموضوع</Label>
          <select
            id="msg-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {MESSAGE_TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="msg-subject">عنوان مختصر</Label>
          <Input
            id="msg-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="مثال: اسم والدي مكتوب خطأ في الشجرة"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="msg-body">نص الرسالة</Label>
          <Textarea
            id="msg-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="اشرح ما تريد بالتفصيل…"
            className="mt-1.5 leading-loose"
          />
        </div>

        <Button onClick={() => void send()} disabled={busy}>
          {busy ? "جارٍ الإرسال…" : "إرسال للإدارة"}
        </Button>
      </div>

      <div>
        <h3 className="font-arabic text-lg text-navy">رسائلي ({items.length})</h3>
        {items.length === 0 && !needsMigration && (
          <p className="mt-3 text-sm text-navy/60">لم ترسل رسالة بعد.</p>
        )}

        <div className="mt-4 space-y-4">
          {items.map((m) => {
            const s = STATUS_LABEL[m.status];
            return (
              <div key={m.id} className="premium-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-arabic text-base text-navy">{m.subject}</h4>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.text}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy/70">
                  {m.body}
                </p>

                {m.admin_reply && (
                  <div className="mt-4 rounded-lg border-r-4 border-gold bg-parchment p-4">
                    <p className="text-xs font-semibold text-navy">رد الإدارة</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-navy/80">
                      {m.admin_reply}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
