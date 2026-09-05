import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichEditor } from "@/components/blog/RichEditor";
import { uploadImage, verifyImageUrl, type Visibility } from "@/lib/contributions";
import {
  OCCASION_KINDS,
  deleteOccasion,
  fetchOccasions,
  kindLabel,
  saveOccasion,
  type Occasion,
  type OccasionDraft,
  type OccasionKind,
} from "@/lib/occasions";

type Me = { id: string; name: string | null };

const EMPTY: OccasionDraft = {
  kind: "gathering",
  title: "",
  body: "",
  location: "",
  starts_at: "",
  cover_image: null,
  visibility: "family",
  status: "published",
};

function formatWhen(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

export function OccasionsTab({
  me,
  onNotice,
  onError,
}: {
  me: Me;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [items, setItems] = useState<Occasion[]>([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [draft, setDraft] = useState<OccasionDraft>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const inlineRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    const res = await fetchOccasions(me.id);
    setItems(res.items);
    setNeedsMigration(res.needsMigration);
    if (res.error) onError(res.error);
  }, [me.id, onError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const upload = async (file: File, asCover: boolean) => {
    setBusy(true);
    onError("");
    onNotice("جارٍ ضغط الصورة ورفعها…");

    const up = await uploadImage(file, me.id, "gallery-images", "occasions");
    if (up.error || !up.url) {
      setBusy(false);
      onError(up.error ?? "تعذّر رفع الصورة.");
      return;
    }
    const ok = await verifyImageUrl(up.url);
    setBusy(false);
    if (!ok) {
      onError("رُفعت الصورة لكن رابطها لا يفتح — مخزن الصور غير معلن للعموم.");
      return;
    }

    if (asCover) {
      setDraft((d) => ({ ...d, cover_image: up.url! }));
      onNotice("رُفعت صورة المناسبة.");
    } else {
      setDraft((d) => ({ ...d, body: `${d.body}<img src="${up.url}" alt="" />` }));
      onNotice("أُدرجت الصورة.");
    }
  };

  const save = async () => {
    if (!draft.title.trim()) {
      onError("اكتب عنوان المناسبة.");
      return;
    }
    setBusy(true);
    onError("");
    const err = await saveOccasion(draft, me);
    setBusy(false);
    if (err) {
      onError(err);
      return;
    }
    setDraft(EMPTY);
    setEditing(false);
    onNotice("نُشرت المناسبة.");
    void reload();
  };

  const remove = async (id: string) => {
    if (!window.confirm("حذف هذه المناسبة نهائياً؟")) return;
    setBusy(true);
    const err = await deleteOccasion(id);
    setBusy(false);
    if (err) onError(err);
    else {
      onNotice("حُذفت المناسبة.");
      void reload();
    }
  };

  return (
    <div className="space-y-6">
      {needsMigration && (
        <div className="premium-card border-amber-400 p-5">
          <p className="font-arabic text-navy">المناسبات غير مفعّلة بعد.</p>
          <p className="mt-2 text-sm text-navy/70">
            على المالك تطبيق ترقية «مناسبات وإعلانات الأعضاء» من لوحة التحكم.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-arabic text-xl text-navy">مناسباتي وإعلاناتي</h2>
        {!editing && (
          <Button
            onClick={() => {
              setDraft(EMPTY);
              setEditing(true);
            }}
          >
            ✎ مناسبة جديدة
          </Button>
        )}
      </div>

      {editing && (
        <div className="premium-card space-y-5 p-6">
          <fieldset>
            <legend className="text-sm font-medium text-navy">نوع المناسبة</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {OCCASION_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, kind: k.id as OccasionKind }))}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                    draft.kind === k.id
                      ? "border-gold bg-gold font-semibold text-navy"
                      : "border-gold/30 bg-white text-navy/70 hover:bg-parchment"
                  }`}
                >
                  {k.icon} {k.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <Label htmlFor="occ-title">العنوان</Label>
            <Input
              id="occ-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="مثال: لقاء العائلة السنوي"
              className="mt-1.5"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="occ-when">التاريخ والوقت (اختياري)</Label>
              <Input
                id="occ-when"
                type="datetime-local"
                value={draft.starts_at}
                onChange={(e) => setDraft((d) => ({ ...d, starts_at: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="occ-place">المكان (اختياري)</Label>
              <Input
                id="occ-place"
                value={draft.location}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                placeholder="مثال: استراحة الحفائر، الرياض"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>التفاصيل</Label>
            <div className="mt-1.5">
              <RichEditor
                value={draft.body}
                onChange={(html) => setDraft((d) => ({ ...d, body: html }))}
                onRequestImage={() => inlineRef.current?.click()}
                placeholder="اكتب تفاصيل المناسبة…"
              />
            </div>
            <input
              ref={inlineRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f, false);
                e.target.value = "";
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => coverRef.current?.click()} disabled={busy}>
              {draft.cover_image ? "تغيير الصورة" : "صورة المناسبة"}
            </Button>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f, true);
                e.target.value = "";
              }}
            />
            {draft.cover_image && (
              <div className="flex items-center gap-2">
                <img
                  src={draft.cover_image}
                  alt=""
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="occ-vis">من يراها</Label>
              <select
                id="occ-vis"
                value={draft.visibility}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, visibility: e.target.value as Visibility }))
                }
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="family">أفراد العائلة المسجّلون</option>
                <option value="public">الجميع</option>
              </select>
            </div>
            <div>
              <Label htmlFor="occ-status">الحالة</Label>
              <select
                id="occ-status"
                value={draft.status}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, status: e.target.value as OccasionDraft["status"] }))
                }
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="published">منشورة</option>
                <option value="draft">مسودة (أنا فقط)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? "جارٍ الحفظ…" : draft.id ? "حفظ التعديل" : "نشر المناسبة"}
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
        <p className="text-sm text-navy/60">لم تنشر مناسبة بعد.</p>
      )}

      <div className="space-y-4">
        {items.map((o) => {
          const k = kindLabel(o.kind);
          return (
            <div key={o.id} className="premium-card flex flex-wrap items-start gap-4 p-5">
              {o.cover_image && (
                <img
                  src={o.cover_image}
                  alt=""
                  className="h-20 w-28 shrink-0 rounded border border-gold/20 object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-arabic text-lg text-navy">
                    {k.icon} {o.title}
                  </h3>
                  {o.status === "draft" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      مسودة
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      o.visibility === "public"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-navy/10 text-navy/70"
                    }`}
                  >
                    {o.visibility === "public" ? "عامة" : "للعائلة"}
                  </span>
                </div>
                {o.starts_at && (
                  <p className="mt-1 text-sm text-navy/60">{formatWhen(o.starts_at)}</p>
                )}
                {o.location && <p className="text-sm text-navy/60">📍 {o.location}</p>}
                <div className="mt-3 flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft({
                        id: o.id,
                        kind: o.kind,
                        title: o.title,
                        body: o.body,
                        location: o.location ?? "",
                        starts_at: o.starts_at ? o.starts_at.slice(0, 16) : "",
                        cover_image: o.cover_image,
                        visibility: o.visibility,
                        status: o.status,
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
                    onClick={() => void remove(o.id)}
                    disabled={busy}
                    className="text-destructive hover:underline"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
