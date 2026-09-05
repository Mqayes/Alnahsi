import { useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useSiteContent, upsertSiteContent, deleteSiteContent } from "@/lib/site-content";
import { translations, t } from "@/lib/i18n/translations";
import { Button } from "@/components/ui/button";

type Field = {
  key: string;
  label: string;
  kind?: "text" | "textarea" | "image";
  def?: string;
  dir?: "rtl" | "ltr";
};
type Section = { id: string; title: string; hint?: string; fields: Field[] };
type Page = { id: string; title: string; sections: Section[] };

const tr = translations as unknown as Record<string, Record<string, unknown>>;
const T = (path: string, lang: "ar" | "en"): string => {
  try {
    const parts = path.split(".");
    let cur: unknown = tr;
    for (const p of parts) cur = (cur as Record<string, unknown>)[p];
    return cur && typeof cur === "object" ? t(cur as { en: string; ar: string }, lang) : "";
  } catch {
    return "";
  }
};

function buildPages(): Page[] {
  const items = (tr.timeline.items as Array<Record<string, unknown>>) ?? [];
  const cards = (tr.businesses.cards as Array<Record<string, unknown>>) ?? [];
  const vals = (tr.values.items as Array<Record<string, unknown>>) ?? [];
  const story = (tr.story?.sections as Array<Record<string, unknown>>) ?? [];
  return [
    {
      id: "home",
      title: "الصفحة الرئيسية",
      sections: [
        {
          id: "hero",
          title: "الواجهة الأولى (Hero)",
          fields: [
            { key: "hero_image_url", label: "صورة الخلفية", kind: "image" },
            { key: "site_name_ar", label: "اسم العائلة (عربي)", def: T("hero.nameAr", "ar") },
            {
              key: "site_name_en",
              label: "اسم العائلة (إنجليزي)",
              def: T("hero.nameEn", "en"),
              dir: "ltr",
            },
          ],
        },
        {
          id: "origin",
          title: "قسم الأصل",
          fields: [
            { key: "origin_image_url", label: "صورة القسم", kind: "image" },
            { key: "origin_title_ar", label: "العنوان", def: T("origin.title", "ar") },
            {
              key: "origin_p1_ar",
              label: "الفقرة الأولى",
              kind: "textarea",
              def: T("origin.p1", "ar"),
            },
            {
              key: "origin_p2_ar",
              label: "الفقرة الثانية",
              kind: "textarea",
              def: T("origin.p2", "ar"),
            },
            {
              key: "origin_pull_ar",
              label: "الاقتباس",
              kind: "textarea",
              def: T("origin.pullquote", "ar") || T("origin.pull", "ar"),
            },
            {
              key: "origin_pull_author_ar",
              label: "صاحب الاقتباس",
              def: T("origin.pullAuthor", "ar") || T("origin.pullquoteAuthor", "ar"),
            },
          ],
        },
        {
          id: "timeline",
          title: "الأجيال (الخط الزمني)",
          fields: [
            { key: "timeline_title_ar", label: "عنوان القسم", def: T("timeline.title", "ar") },
            ...items.flatMap((it, i) => [
              {
                key: `timeline_${i}_year`,
                label: `المحطة ${i + 1} — السنة`,
                def: String(it.year ?? ""),
                dir: "ltr" as const,
              },
              {
                key: `timeline_${i}_gen_ar`,
                label: `المحطة ${i + 1} — العنوان`,
                def: t(it.gen as { en: string; ar: string }, "ar"),
              },
              {
                key: `timeline_${i}_text_ar`,
                label: `المحطة ${i + 1} — النص`,
                kind: "textarea" as const,
                def: t(it.text as { en: string; ar: string }, "ar"),
              },
            ]),
          ],
        },
        {
          id: "values",
          title: "القيم",
          fields: [
            { key: "values_eyebrow_ar", label: "العنوان الصغير", def: T("values.eyebrow", "ar") },
            { key: "values_title_ar", label: "العنوان", def: T("values.title", "ar") },
            ...vals.flatMap((v, i) => [
              {
                key: `values_card_${i}_name_ar`,
                label: `القيمة ${i + 1} — الاسم`,
                def: typeof v.ar === "string" ? v.ar : t(v.en as { en: string; ar: string }, "ar"),
              },
              {
                key: `values_card_${i}_desc_ar`,
                label: `القيمة ${i + 1} — الوصف`,
                kind: "textarea" as const,
                def: t(v.desc as { en: string; ar: string }, "ar"),
              },
            ]),
          ],
        },
        {
          id: "legacy",
          title: "الإرث (البطاقات)",
          fields: [
            { key: "legacy_title_ar", label: "العنوان", def: T("businesses.title", "ar") },
            {
              key: "legacy_intro_ar",
              label: "المقدمة",
              kind: "textarea",
              def: T("businesses.intro", "ar"),
            },
            ...cards.flatMap((c, i) => [
              {
                key: `legacy_card_${i}_year`,
                label: `البطاقة ${i + 1} — السنة`,
                def: String(c.year ?? ""),
                dir: "ltr" as const,
              },
              {
                key: `legacy_card_${i}_name_ar`,
                label: `البطاقة ${i + 1} — العنوان`,
                def: t(c.name as { en: string; ar: string }, "ar"),
              },
              {
                key: `legacy_card_${i}_story_ar`,
                label: `البطاقة ${i + 1} — النص`,
                kind: "textarea" as const,
                def: t(c.story as { en: string; ar: string }, "ar"),
              },
              {
                key: `business_image_${i}`,
                label: `البطاقة ${i + 1} — صورة (اختياري)`,
                kind: "image" as const,
              },
            ]),
          ],
        },
        {
          id: "gallery",
          title: "معاينة الأرشيف",
          fields: [
            { key: "gallery_eyebrow_ar", label: "العنوان الصغير", def: T("gallery.eyebrow", "ar") },
            { key: "gallery_title_ar", label: "العنوان", def: T("gallery.title", "ar") },
            {
              key: "gallery_intro_ar",
              label: "المقدمة",
              kind: "textarea",
              def: T("gallery.intro", "ar"),
            },
          ],
        },
        {
          id: "portal",
          title: "دعوة بوابة العائلة",
          fields: [
            {
              key: "portal_eyebrow_ar",
              label: "العنوان الصغير",
              def: T("portalCta.eyebrow", "ar"),
            },
            { key: "portal_title_ar", label: "العنوان", def: T("portalCta.title", "ar") },
            {
              key: "portal_body_ar",
              label: "النص",
              kind: "textarea",
              def: T("portalCta.body", "ar"),
            },
          ],
        },
      ],
    },
    {
      id: "story",
      title: "صفحة قصتنا",
      sections: [
        {
          id: "patriarch",
          title: "صورة الجدّ",
          fields: [
            { key: "story_patriarch_image", label: "الصورة", kind: "image" },
            {
              key: "story_patriarch_caption_ar",
              label: "التعليق تحت الصورة",
              def: "الجدّ الأكبر · نحو ١٩٢٥",
            },
          ],
        },
        ...story.map((s, i) => ({
          id: `s${i}`,
          title: `الفصل ${i + 1}: ${t(s.h as { en: string; ar: string }, "ar")}`,
          fields: [
            {
              key: `story_s${i}_h_ar`,
              label: "العنوان",
              def: t(s.h as { en: string; ar: string }, "ar"),
            },
            {
              key: `story_s${i}_p_ar`,
              label: "النص",
              kind: "textarea" as const,
              def: t(s.p as { en: string; ar: string }, "ar"),
            },
          ],
        })),
      ],
    },
  ];
}

export function ContentEditor() {
  const sc = useSiteContent();
  const pages = useMemo(buildPages, []);
  const [pageId, setPageId] = useState(pages[0].id);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  const page = pages.find((p) => p.id === pageId)!;
  const sections = sectionId ? page.sections.filter((s) => s.id === sectionId) : page.sections;
  const val = (f: Field) => draft[f.key] ?? sc[f.key] ?? f.def ?? "";
  const overridden = (f: Field) => sc[f.key] != null && sc[f.key] !== "";
  const dirty = (f: Field) => draft[f.key] != null && draft[f.key] !== (sc[f.key] ?? f.def ?? "");

  const save = async (f: Field) => {
    setBusy(f.key);
    const v = (draft[f.key] ?? "").trim();
    const err =
      v && v !== f.def ? await upsertSiteContent(f.key, v) : await deleteSiteContent(f.key);
    setNote((n) => ({ ...n, [f.key]: err ? "✗ " + err : "✓ تم الحفظ" }));
    setDraft((d) => {
      const c = { ...d };
      delete c[f.key];
      return c;
    });
    setBusy(null);
  };
  const reset = async (f: Field) => {
    setBusy(f.key);
    const err = await deleteSiteContent(f.key);
    setNote((n) => ({ ...n, [f.key]: err ? "✗ " + err : "↺ أُعيد الأصل" }));
    setDraft((d) => {
      const c = { ...d };
      delete c[f.key];
      return c;
    });
    setBusy(null);
  };
  const upload = async (f: Field, file: File) => {
    setBusy(f.key);
    const ext = file.name.split(".").pop();
    const path = `site/${f.key}-${Date.now()}.${ext}`;
    const { error } = await getSupabase()
      .storage.from("site-images")
      .upload(path, file, { upsert: true });
    if (error) {
      setNote((n) => ({ ...n, [f.key]: "✗ " + error.message }));
      setBusy(null);
      return;
    }
    const { data } = getSupabase().storage.from("site-images").getPublicUrl(path);
    const err = await upsertSiteContent(f.key, data.publicUrl);
    setNote((n) => ({ ...n, [f.key]: err ? "✗ " + err : "✓ رُفعت الصورة" }));
    setBusy(null);
  };

  const I =
    "w-full rounded-md border border-gold/40 bg-parchment px-3 py-2 text-navy outline-none focus:border-gold";

  return (
    <div dir="rtl" className="space-y-5">
      <div className="premium-card p-5">
        <h3 className="font-arabic text-xl text-navy">محرر محتوى الصفحات</h3>
        <p className="mt-1 text-sm text-navy/60">
          اختر الصفحة ثم القسم — يظهر لك النص والصورة كما هما في الموقع، عدّل مباشرة واحفظ. "إعادة
          الأصل" يرجع النص الافتراضي.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPageId(p.id);
                setSectionId(null);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm ${pageId === p.id ? "border-gold bg-gold text-navy" : "border-gold/30 bg-white text-navy/70"}`}
            >
              {p.title}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setSectionId(null)}
            className={`rounded-full border px-3 py-1 text-xs ${!sectionId ? "border-navy bg-navy text-white" : "border-navy/20 text-navy/60"}`}
          >
            كل الأقسام
          </button>
          {page.sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSectionId(s.id)}
              className={`rounded-full border px-3 py-1 text-xs ${sectionId === s.id ? "border-navy bg-navy text-white" : "border-navy/20 text-navy/60"}`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {sections.map((s) => (
        <div key={s.id} className="premium-card p-5">
          <h4 className="font-arabic text-lg text-navy">{s.title}</h4>
          <div className="mt-3 divide-y divide-gold/15">
            {s.fields.map((f) => (
              <div key={f.key} className="grid gap-2 py-4 md:grid-cols-[180px_1fr]">
                <div>
                  <div className="text-sm text-navy">{f.label}</div>
                  {overridden(f) && (
                    <span className="mt-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[10px] text-gold">
                      معدّل
                    </span>
                  )}
                  {note[f.key] && <div className="mt-1 text-xs text-navy/60">{note[f.key]}</div>}
                </div>
                <div>
                  {f.kind === "image" ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="h-24 w-36 overflow-hidden rounded-md border border-gold/30 bg-parchment">
                        {sc[f.key] ? (
                          <img src={sc[f.key]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-navy/40">
                            الصورة الأصلية
                          </div>
                        )}
                      </div>
                      <label className="cursor-pointer rounded-md border border-gold/40 bg-white px-3 py-1.5 text-xs text-navy hover:bg-parchment">
                        {busy === f.key ? "…" : "⬆ رفع / استبدال"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && void upload(f, e.target.files[0])}
                        />
                      </label>
                      {overridden(f) && (
                        <button
                          onClick={() => void reset(f)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          ↺ إعادة الأصل
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {f.kind === "textarea" ? (
                        <textarea
                          className={I}
                          rows={3}
                          dir={f.dir ?? "rtl"}
                          value={val(f)}
                          onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        />
                      ) : (
                        <input
                          className={I}
                          dir={f.dir ?? "rtl"}
                          value={val(f)}
                          onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        />
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <Button
                          size="sm"
                          disabled={!dirty(f) || busy === f.key}
                          onClick={() => void save(f)}
                          className="bg-gold text-navy hover:bg-gold/90"
                        >
                          {busy === f.key ? "…" : "حفظ"}
                        </Button>
                        {overridden(f) && (
                          <button
                            onClick={() => void reset(f)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            ↺ إعادة الأصل
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
