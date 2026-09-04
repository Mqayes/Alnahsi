import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichEditor } from "@/components/blog/RichEditor";
import {
  deleteNews,
  fetchMyNews,
  publishNews,
  uploadImage,
  verifyImageUrl,
  type MemberNews,
  type Visibility,
} from "@/lib/contributions";

type Me = { id: string; name: string | null };

type Draft = {
  id?: string;
  title: string;
  body: string;
  cover_image: string | null;
  visibility: Visibility;
};

const EMPTY: Draft = { title: "", body: "", cover_image: null, visibility: "family" };

export function NewsContribTab({
  me,
  onNotice,
  onError,
}: {
  me: Me;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [items, setItems] = useState<MemberNews[]>([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const inlineRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    const res = await fetchMyNews(me.id);
    setItems(res.items);
    setNeedsMigration(res.needsMigration);
    if (res.error) onError(res.error);
  }, [me.id, onError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleUpload = async (file: File, asCover: boolean) => {
    setBusy(true);
    onError("");
    onNotice("جارٍ ضغط الصورة ورفعها…");

    const up = await uploadImage(file, me.id, "gallery-images", "news");
    if (up.error || !up.url) {
      setBusy(false);
      onError(up.error ?? "تعذّر رفع الصورة.");
      return;
    }

    const reachable = await verifyImageUrl(up.url);
    setBusy(false);
    if (!reachable) {
      onError("رُفعت الصورة لكن رابطها لا يفتح — مخزن الصور غير معلن للعموم.");
      return;
    }

    if (asCover) {
      setDraft((d) => ({ ...d, cover_image: up.url! }));
      onNotice("رُفعت صورة الغلاف.");
    } else {
      setDraft((d) => ({ ...d, body: `${d.body}<img src="${up.url}" alt="" />` }));
      onNotice("أُدرجت الصورة في الخبر.");
    }
  };

  const save = async () => {
    if (!draft.title.trim()) {
      onError("اكتب عنواناً للخبر.");
      return;
    }
    setBusy(true);
    onError("");
    const err = await publishNews(draft, me);
    setBusy(false);
    if (err) {
      onError(err);
      return;
    }
    setDraft(EMPTY);
    setEditing(false);
    onNotice("نُشر الخبر.");
    void reload();
  };

  const remove = async (id: string) => {
    if (!window.confirm("حذف هذا الخبر نهائياً؟")) return;
    setBusy(true);
    const err = await deleteNews(id);
    setBusy(false);
    if (err) onError(err);
    else {
      onNotice("حُذف الخبر.");
      void reload();
    }
  };

  return (
    <div className="space-y-6">
      {needsMigration && (
        <div className="premium-card border-amber-400 p-5">
          <p className="font-arabic text-navy">نشر الأخبار للأعضاء غير مفعّل بعد.</p>
          <p className="mt-2 text-sm text-navy/70">
            على المالك تطبيق ترقية «مشاركات الأعضاء» من لوحة التحكم ← الإعدادات.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-arabic text-xl text-navy">أخباري</h2>
        {!editing && (
          <Button
            onClick={() => {
              setDraft(EMPTY);
              setEditing(true);
            }}
          >
            ✎ خبر جديد
          </Button>
        )}
      </div>

      {editing && (
        <div className="premium-card space-y-5 p-6">
          <div>
            <Label htmlFor="news-title">عنوان الخبر</Label>
            <Input
              id="news-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="مثال: تخرّج عبدالله من كلية الهندسة"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>نص الخبر</Label>
            <div className="mt-1.5">
              <RichEditor
                value={draft.body}
                onChange={(html) => setDraft((d) => ({ ...d, body: html }))}
                onRequestImage={() => inlineRef.current?.click()}
                placeholder="اكتب تفاصيل الخبر…"
              />
            </div>
            <input
              ref={inlineRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f, false);
                e.target.value = "";
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => coverRef.current?.click()} disabled={busy}>
              {draft.cover_image ? "تغيير صورة الغلاف" : "صورة الغلاف"}
            </Button>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f, true);
                e.target.value = "";
              }}
            />
            {draft.cover_image && (
              <div className="flex items-center gap-2">
                <img
                  src={draft.cover_image}
                  alt="الغلاف"
                  className="h-12 w-20 rounded border border-gold/30 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, cover_image: null }))}
                  className="text-xs text-destructive hover:underline"
                >
                  إزالة
                </button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="news-visibility">من يرى الخبر</Label>
            <select
              id="news-visibility"
              value={draft.visibility}
              onChange={(e) =>
                setDraft((d) => ({ ...d, visibility: e.target.value as Visibility }))
              }
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm sm:w-72"
            >
              <option value="family">أفراد العائلة المسجّلون</option>
              <option value="public">الجميع (يظهر للزوار)</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? "جارٍ الحفظ…" : draft.id ? "حفظ التعديل" : "نشر الخبر"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false);
                setDraft(EMPTY);
              }}
              disabled={busy}
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 && !needsMigration && (
        <p className="text-sm text-navy/60">لم تنشر خبراً بعد.</p>
      )}

      <div className="space-y-4">
        {items.map((n) => (
          <div key={n.id} className="premium-card flex flex-wrap items-start gap-4 p-5">
            {n.cover_image && (
              <img
                src={n.cover_image}
                alt=""
                className="h-20 w-28 shrink-0 rounded border border-gold/20 object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-arabic text-lg text-navy">{n.title_ar}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    n.visibility === "public"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {n.visibility === "public" ? "عام" : "للعائلة"}
                </span>
              </div>
              <div className="mt-3 flex gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setDraft({
                      id: n.id,
                      title: n.title_ar,
                      body: n.content_ar,
                      cover_image: n.cover_image,
                      visibility: n.visibility,
                    });
                    setEditing(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-navy hover:text-gold"
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => void remove(n.id)}
                  disabled={busy}
                  className="text-destructive hover:underline"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
