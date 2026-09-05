import { getSupabase, isSupabaseConfigured, withTimeout } from "@/lib/supabase";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { isMissingSchema, type Visibility } from "@/lib/contributions";

/* ─────────────── المناسبات والإعلانات ─────────────── */

export const OCCASION_KINDS = [
  { id: "gathering", label: "لقاء عائلي", icon: "🫂" },
  { id: "wedding", label: "زواج", icon: "💍" },
  { id: "graduation", label: "تخرّج", icon: "🎓" },
  { id: "birth", label: "مولود", icon: "👶" },
  { id: "travel", label: "سفر / عودة", icon: "✈️" },
  { id: "condolence", label: "عزاء", icon: "🤍" },
  { id: "announcement", label: "إعلان عام", icon: "📢" },
] as const;

export type OccasionKind = (typeof OCCASION_KINDS)[number]["id"];

export function kindLabel(kind: string): { label: string; icon: string } {
  const found = OCCASION_KINDS.find((k) => k.id === kind);
  return found ? { label: found.label, icon: found.icon } : { label: "مناسبة", icon: "📅" };
}

export type Occasion = {
  id: string;
  author_id: string;
  author_name: string | null;
  kind: OccasionKind;
  title: string;
  body: string;
  location: string | null;
  starts_at: string | null;
  cover_image: string | null;
  visibility: Visibility;
  status: "draft" | "published";
  created_at: string;
};

export type OccasionDraft = {
  id?: string;
  kind: OccasionKind;
  title: string;
  body: string;
  location: string;
  starts_at: string;
  cover_image: string | null;
  visibility: Visibility;
  status: "draft" | "published";
};

export type OccasionResult = { items: Occasion[]; needsMigration: boolean; error?: string };

function normalizeOccasion(row: Record<string, unknown>): Occasion {
  const str = (k: string) => (typeof row[k] === "string" ? (row[k] as string) : null);
  return {
    id: String(row.id ?? ""),
    author_id: String(row.author_id ?? ""),
    author_name: str("author_name"),
    kind: (str("kind") ?? "announcement") as OccasionKind,
    title: str("title") ?? "",
    body: str("body") ?? "",
    location: str("location"),
    starts_at: str("starts_at"),
    cover_image: str("cover_image"),
    visibility: row.visibility === "public" ? "public" : "family",
    status: row.status === "draft" ? "draft" : "published",
    created_at: str("created_at") ?? new Date().toISOString(),
  };
}

export async function fetchOccasions(authorId?: string): Promise<OccasionResult> {
  if (!isSupabaseConfigured()) return { items: [], needsMigration: false };

  try {
    let q = getSupabase().from("occasions").select("*");
    if (authorId) q = q.eq("author_id", authorId);
    else q = q.eq("status", "published");

    const { data, error } = await withTimeout(
      q.order("created_at", { ascending: false }).limit(60),
      10_000,
      "تحميل المناسبات",
    );

    if (error) {
      if (isMissingSchema(error)) return { items: [], needsMigration: true };
      return { items: [], needsMigration: false, error: error.message };
    }
    return {
      items: (data ?? []).map((r) => normalizeOccasion(r as Record<string, unknown>)),
      needsMigration: false,
    };
  } catch (err) {
    return {
      items: [],
      needsMigration: false,
      error: err instanceof Error ? err.message : "تعذّر تحميل المناسبات",
    };
  }
}

export async function saveOccasion(
  draft: OccasionDraft,
  author: { id: string; name: string | null },
): Promise<string | null> {
  const payload = {
    author_id: author.id,
    author_name: author.name,
    kind: draft.kind,
    title: draft.title.trim(),
    body: sanitizeHtml(draft.body),
    location: draft.location.trim() || null,
    starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
    cover_image: draft.cover_image,
    visibility: draft.visibility,
    status: draft.status,
    updated_at: new Date().toISOString(),
  };

  const { error } = draft.id
    ? await getSupabase().from("occasions").update(payload).eq("id", draft.id)
    : await getSupabase().from("occasions").insert(payload);

  return error ? error.message : null;
}

export async function deleteOccasion(id: string): Promise<string | null> {
  const { error } = await getSupabase().from("occasions").delete().eq("id", id);
  return error ? error.message : null;
}

/* ─────────────── مراسلة الإدارة ─────────────── */

export const MESSAGE_TOPICS = [
  { id: "general", label: "استفسار عام" },
  { id: "tree", label: "تصحيح في شجرة النسب" },
  { id: "account", label: "مشكلة في الحساب" },
  { id: "content", label: "طلب نشر أو تعديل محتوى" },
  { id: "report", label: "الإبلاغ عن محتوى مخالف" },
] as const;

export type MemberMessage = {
  id: string;
  sender_id: string;
  sender_name: string | null;
  sender_email: string | null;
  topic: string;
  subject: string;
  body: string;
  status: "new" | "read" | "replied" | "closed";
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
};

export type MessageResult = { items: MemberMessage[]; needsMigration: boolean; error?: string };

function normalizeMessage(row: Record<string, unknown>): MemberMessage {
  const str = (k: string) => (typeof row[k] === "string" ? (row[k] as string) : null);
  const status = str("status");
  return {
    id: String(row.id ?? ""),
    sender_id: String(row.sender_id ?? ""),
    sender_name: str("sender_name"),
    sender_email: str("sender_email"),
    topic: str("topic") ?? "general",
    subject: str("subject") ?? "",
    body: str("body") ?? "",
    status:
      status === "read" || status === "replied" || status === "closed"
        ? (status as MemberMessage["status"])
        : "new",
    admin_reply: str("admin_reply"),
    replied_at: str("replied_at"),
    created_at: str("created_at") ?? new Date().toISOString(),
  };
}

/** بدون senderId تُرجع صندوق الإدارة كاملاً (السياسات تحكم من يرى ماذا) */
export async function fetchMessages(senderId?: string): Promise<MessageResult> {
  if (!isSupabaseConfigured()) return { items: [], needsMigration: false };

  try {
    let q = getSupabase().from("member_messages").select("*");
    if (senderId) q = q.eq("sender_id", senderId);

    const { data, error } = await withTimeout(
      q.order("created_at", { ascending: false }).limit(100),
      10_000,
      "تحميل الرسائل",
    );

    if (error) {
      if (isMissingSchema(error)) return { items: [], needsMigration: true };
      return { items: [], needsMigration: false, error: error.message };
    }
    return {
      items: (data ?? []).map((r) => normalizeMessage(r as Record<string, unknown>)),
      needsMigration: false,
    };
  } catch (err) {
    return {
      items: [],
      needsMigration: false,
      error: err instanceof Error ? err.message : "تعذّر تحميل الرسائل",
    };
  }
}

export async function sendMessage(
  msg: { topic: string; subject: string; body: string },
  sender: { id: string; name: string | null; email: string | null },
): Promise<string | null> {
  const { error } = await getSupabase().from("member_messages").insert({
    sender_id: sender.id,
    sender_name: sender.name,
    sender_email: sender.email,
    topic: msg.topic,
    subject: msg.subject.trim(),
    body: msg.body.trim(),
  });
  return error ? error.message : null;
}

export async function replyToMessage(
  id: string,
  reply: string,
  status: MemberMessage["status"] = "replied",
): Promise<string | null> {
  const { error } = await getSupabase()
    .from("member_messages")
    .update({ admin_reply: reply.trim(), status, replied_at: new Date().toISOString() })
    .eq("id", id);
  return error ? error.message : null;
}

export async function setMessageStatus(
  id: string,
  status: MemberMessage["status"],
): Promise<string | null> {
  const { error } = await getSupabase().from("member_messages").update({ status }).eq("id", id);
  return error ? error.message : null;
}
