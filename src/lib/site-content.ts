import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export type SiteContent = Record<string, string>;

let cache: SiteContent | null = null;
const listeners = new Set<(c: SiteContent) => void>();

async function loadContent(): Promise<SiteContent> {
  if (!isSupabaseConfigured()) return {};
  const { data } = await getSupabase()
    .from("site_content")
    .select("key, value");
  const result: SiteContent = {};
  for (const row of data ?? []) result[row.key] = row.value;
  return result;
}

export function invalidateSiteContent() {
  cache = null;
  loadContent().then((c) => {
    cache = c;
    listeners.forEach((fn) => fn(c));
  });
}

export async function upsertSiteContent(key: string, value: string): Promise<string | null> {
  const { error } = await getSupabase()
    .from("site_content")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return error.message;
  invalidateSiteContent();
  return null;
}

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(cache ?? {});

  useEffect(() => {
    if (cache) {
      setContent(cache);
      return;
    }
    loadContent().then((c) => {
      cache = c;
      setContent(c);
    });
    listeners.add(setContent);
    return () => { listeners.delete(setContent); };
  }, []);

  return content;
}
