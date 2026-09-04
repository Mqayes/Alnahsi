import { getSupabase, isSupabaseConfigured, withTimeout } from "@/lib/supabase";
import { compressImage } from "@/lib/image-compress";
import { sanitizeHtml } from "@/lib/sanitize-html";

/** الحد بعد الضغط. الصور الأكبر تُصغَّر تلقائياً بدل رفضها. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type Visibility = "family" | "public";

export type GalleryItem = {
  id: string;
  uploader_id: string;
  uploader_name: string | null;
  path: string;
  url: string;
  caption: string | null;
  visibility: Visibility;
  created_at: string;
};

export type MemberNews = {
  id: string;
  author_id: string | null;
  author_name: string | null;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  cover_image: string | null;
  visibility: Visibility;
  created_at: string;
};

const MISSING = ["42P01", "PGRST205", "42703"];

export function isMissingSchema(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code && MISSING.includes(error.code)) return true;
  const m = (error.message ?? "").toLowerCase();
  return m.includes("does not exist") || m.includes("could not find");
}

function mapStorageError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("bucket") && m.includes("not found")) {
    return "مخزن الصور غير مهيّأ — على المالك تطبيق ترقية «مشاركات الأعضاء» من لوحة التحكم.";
  }
  if (m.includes("row-level security") || m.includes("unauthorized") || m.includes("policy")) {
    return "لا تملك صلاحية الرفع. سجّل خروجك ثم ادخل مرة أخرى، فإن استمر أبلغ المشرف.";
  }
  if (m.includes("payload") || m.includes("too large")) {
    return "حجم الملف تجاوز حد الخادم.";
  }
  return message;
}

/** يتأكد أن الرابط يفتح فعلاً — يكشف خطأ الصلاحيات فوراً بدل صورة مكسورة لاحقاً */
export function verifyImageUrl(url: string, timeoutMs = 15_000): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(true);
  return new Promise((resolve) => {
    const img = new Image();
    const done = (ok: boolean) => {
      img.onload = img.onerror = null;
      resolve(ok);
    };
    const timer = setTimeout(() => done(false), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      done(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      done(false);
    };
    img.src = url;
  });
}

export type UploadOutcome = {
  url?: string;
  path?: string;
  error?: string;
  savedBytes?: number;
};

/**
 * يضغط ثم يرفع داخل مجلد العضو. مسار الأرشيف members/{uid}/… حتى تمنع
 * السياسة أي عضو من الكتابة في مجلد غيره أو حذف صور الآخرين.
 */
export async function uploadImage(
  file: File,
  userId: string,
  bucket: "gallery-images" | "blog-images",
  folder = "members",
): Promise<UploadOutcome> {
  if (!file.type.startsWith("image/") && !/\.hei[cf]$/i.test(file.name)) {
    return { error: "الملف المختار ليس صورة." };
  }

  const prepared = await compressImage(file, MAX_UPLOAD_BYTES);
  if (prepared.error) return { error: prepared.error };

  const ready = prepared.file;
  const ext = (ready.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;

  const { error } = await getSupabase()
    .storage.from(bucket)
    .upload(path, ready, { upsert: false, contentType: ready.type });

  if (error) return { error: mapStorageError(error.message) };

  const { data } = getSupabase().storage.from(bucket).getPublicUrl(path);
  return {
    url: data.publicUrl,
    path,
    savedBytes: Math.max(0, prepared.originalBytes - prepared.finalBytes),
  };
}

/* ─────────────── سجل صور العائلة ─────────────── */

export type GalleryResult = { items: GalleryItem[]; needsMigration: boolean; error?: string };

function normalizeGallery(row: Record<string, unknown>): GalleryItem {
  return {
    id: String(row.id ?? ""),
    uploader_id: String(row.uploader_id ?? ""),
    uploader_name: typeof row.uploader_name === "string" ? row.uploader_name : null,
    path: String(row.path ?? ""),
    url: String(row.url ?? ""),
    caption: typeof row.caption === "string" ? row.caption : null,
    visibility: row.visibility === "public" ? "public" : "family",
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export async function fetchGallery(uploaderId?: string): Promise<GalleryResult> {
  if (!isSupabaseConfigured()) return { items: [], needsMigration: false };

  try {
    let q = getSupabase()
      .from("gallery_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (uploaderId) q = q.eq("uploader_id", uploaderId);

    const { data, error } = await withTimeout(q, 10_000, "تحميل الصور");
    if (error) {
      if (isMissingSchema(error)) return { items: [], needsMigration: true };
      return { items: [], needsMigration: false, error: error.message };
    }
    return {
      items: (data ?? []).map((r) => normalizeGallery(r as Record<string, unknown>)),
      needsMigration: false,
    };
  } catch (err) {
    return {
      items: [],
      needsMigration: false,
      error: err instanceof Error ? err.message : "تعذّر تحميل الصور",
    };
  }
}

export async function addGalleryItem(item: {
  uploaderId: string;
  uploaderName: string | null;
  path: string;
  url: string;
  caption: string;
  visibility: Visibility;
}): Promise<string | null> {
  const { error } = await getSupabase()
    .from("gallery_items")
    .insert({
      uploader_id: item.uploaderId,
      uploader_name: item.uploaderName,
      path: item.path,
      url: item.url,
      caption: item.caption.trim() || null,
      visibility: item.visibility,
    });
  return error ? error.message : null;
}

export async function setGalleryVisibility(
  id: string,
  visibility: Visibility,
): Promise<string | null> {
  const { error } = await getSupabase().from("gallery_items").update({ visibility }).eq("id", id);
  return error ? error.message : null;
}

export async function deleteGalleryItem(item: GalleryItem): Promise<string | null> {
  const { error } = await getSupabase().from("gallery_items").delete().eq("id", item.id);
  if (error) return error.message;
  // حذف الملف تالٍ للسجل: بقاء ملف يتيم أهون من بقاء سجل يشير للعدم
  await getSupabase().storage.from("gallery-images").remove([item.path]);
  return null;
}

/* ─────────────── أخبار الأعضاء ─────────────── */

export type NewsResult = { items: MemberNews[]; needsMigration: boolean; error?: string };

function normalizeNews(row: Record<string, unknown>): MemberNews {
  const str = (k: string) => (typeof row[k] === "string" ? (row[k] as string) : "");
  return {
    id: String(row.id ?? ""),
    author_id: typeof row.author_id === "string" ? row.author_id : null,
    author_name: typeof row.author_name === "string" ? row.author_name : null,
    title_ar: str("title_ar") || str("title_en"),
    title_en: str("title_en") || str("title_ar"),
    content_ar: str("content_ar") || str("content_en"),
    content_en: str("content_en") || str("content_ar"),
    cover_image: typeof row.cover_image === "string" && row.cover_image ? row.cover_image : null,
    visibility: row.visibility === "public" ? "public" : "family",
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

export async function fetchMyNews(authorId: string): Promise<NewsResult> {
  if (!isSupabaseConfigured()) return { items: [], needsMigration: false };

  try {
    const { data, error } = await withTimeout(
      getSupabase()
        .from("news_posts")
        .select("*")
        .eq("author_id", authorId)
        .order("created_at", { ascending: false }),
      10_000,
      "تحميل أخباري",
    );
    if (error) {
      if (isMissingSchema(error)) return { items: [], needsMigration: true };
      return { items: [], needsMigration: false, error: error.message };
    }
    return {
      items: (data ?? []).map((r) => normalizeNews(r as Record<string, unknown>)),
      needsMigration: false,
    };
  } catch (err) {
    return {
      items: [],
      needsMigration: false,
      error: err instanceof Error ? err.message : "تعذّر تحميل الأخبار",
    };
  }
}

export async function publishNews(
  draft: {
    id?: string;
    title: string;
    body: string;
    cover_image: string | null;
    visibility: Visibility;
  },
  author: { id: string; name: string | null },
): Promise<string | null> {
  const clean = sanitizeHtml(draft.body);
  const payload = {
    author_id: author.id,
    author_name: author.name,
    title_ar: draft.title.trim(),
    title_en: draft.title.trim(),
    content_ar: clean,
    content_en: clean,
    cover_image: draft.cover_image,
    visibility: draft.visibility,
  };

  const { error } = draft.id
    ? await getSupabase().from("news_posts").update(payload).eq("id", draft.id)
    : await getSupabase().from("news_posts").insert(payload);

  return error ? error.message : null;
}

export async function deleteNews(id: string): Promise<string | null> {
  const { error } = await getSupabase().from("news_posts").delete().eq("id", id);
  return error ? error.message : null;
}
