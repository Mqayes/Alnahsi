import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addGalleryItem,
  deleteGalleryItem,
  fetchGallery,
  setGalleryVisibility,
  uploadImage,
  verifyImageUrl,
  type GalleryItem,
  type Visibility,
} from "@/lib/contributions";

type Me = { id: string; name: string | null };

export function GalleryContribTab({
  me,
  onNotice,
  onError,
}: {
  me: Me;
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("family");
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    const res = await fetchGallery(me.id);
    setItems(res.items);
    setNeedsMigration(res.needsMigration);
    if (res.error) onError(res.error);
  }, [me.id, onError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleFiles = async (files: FileList) => {
    setBusy(true);
    onError("");

    let done = 0;
    let savedTotal = 0;

    for (const file of Array.from(files)) {
      onNotice(`جارٍ رفع ${done + 1} من ${files.length}…`);

      const up = await uploadImage(file, me.id, "gallery-images");
      if (up.error || !up.url || !up.path) {
        onError(`${file.name}: ${up.error ?? "تعذّر الرفع."}`);
        continue;
      }

      const reachable = await verifyImageUrl(up.url);
      if (!reachable) {
        onError("رُفعت الصورة لكن رابطها لا يفتح — مخزن الصور غير معلن للعموم.");
        continue;
      }

      const err = await addGalleryItem({
        uploaderId: me.id,
        uploaderName: me.name,
        path: up.path,
        url: up.url,
        caption,
        visibility,
      });
      if (err) {
        onError(err);
        continue;
      }

      savedTotal += up.savedBytes ?? 0;
      done++;
    }

    setBusy(false);
    setCaption("");
    if (done > 0) {
      const saved =
        savedTotal > 100_000 ? ` (وُفّر ${Math.round(savedTotal / 1024)} كيلوبايت)` : "";
      onNotice(`أُضيفت ${done} صورة${saved}.`);
      void reload();
    }
  };

  const toggleVisibility = async (item: GalleryItem) => {
    const next: Visibility = item.visibility === "public" ? "family" : "public";
    setBusy(true);
    const err = await setGalleryVisibility(item.id, next);
    setBusy(false);
    if (err) onError(err);
    else {
      onNotice(next === "public" ? "الصورة صارت عامة." : "الصورة صارت للعائلة فقط.");
      void reload();
    }
  };

  const remove = async (item: GalleryItem) => {
    if (!window.confirm("حذف هذه الصورة نهائياً؟")) return;
    setBusy(true);
    const err = await deleteGalleryItem(item);
    setBusy(false);
    if (err) onError(err);
    else {
      onNotice("حُذفت الصورة.");
      void reload();
    }
  };

  return (
    <div className="space-y-6">
      {needsMigration && (
        <div className="premium-card border-amber-400 p-5">
          <p className="font-arabic text-navy">سجل الصور غير مفعّل بعد.</p>
          <p className="mt-2 text-sm text-navy/70">
            على المالك تطبيق ترقية «مشاركات الأعضاء» من لوحة التحكم ← الإعدادات.
          </p>
        </div>
      )}

      <div className="premium-card space-y-4 p-6">
        <h2 className="font-arabic text-xl text-navy">أضف صوراً لسجل العائلة</h2>

        <div>
          <Label htmlFor="cap">وصف الصورة (اختياري)</Label>
          <Input
            id="cap"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="مثال: جدّي في مزرعة الحفائر، ١٩٧٨"
            className="mt-1.5"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-navy">من يرى هذه الصور؟</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {(
              [
                { v: "family" as const, label: "أفراد العائلة المسجّلون", hint: "لا تظهر للزوار" },
                { v: "public" as const, label: "الجميع", hint: "تظهر في الأرشيف العام" },
              ] satisfies { v: Visibility; label: string; hint: string }[]
            ).map((opt) => (
              <label
                key={opt.v}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${
                  visibility === opt.v
                    ? "border-gold bg-gold/10 text-navy"
                    : "border-gold/30 text-navy/70 hover:bg-parchment"
                }`}
              >
                <input
                  type="radio"
                  name="gallery-visibility"
                  className="mt-1"
                  checked={visibility === opt.v}
                  onChange={() => setVisibility(opt.v)}
                />
                <span>
                  <span className="block font-medium">{opt.label}</span>
                  <span className="block text-xs text-navy/50">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <Button onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? "جارٍ الرفع…" : "🖼 اختر صوراً من جهازك"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="mt-2 text-xs text-navy/50">
            تستطيع اختيار عدة صور دفعة واحدة. تُضغط في جهازك قبل الرفع، فلا يهمّ حجمها.
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-arabic text-lg text-navy">صوري ({items.length})</h3>

        {items.length === 0 && !needsMigration && (
          <p className="mt-3 text-sm text-navy/60">لم ترفع صوراً بعد.</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="premium-card overflow-hidden">
              <img
                src={item.url}
                alt={item.caption ?? ""}
                loading="lazy"
                className="h-36 w-full object-cover"
              />
              <div className="space-y-2 p-3">
                {item.caption && <p className="text-xs text-navy/70">{item.caption}</p>}
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${
                    item.visibility === "public"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {item.visibility === "public" ? "عامة" : "للعائلة فقط"}
                </span>
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => void toggleVisibility(item)}
                    disabled={busy}
                    className="text-navy hover:text-gold"
                  >
                    {item.visibility === "public" ? "اجعلها للعائلة" : "اجعلها عامة"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(item)}
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
    </div>
  );
}
