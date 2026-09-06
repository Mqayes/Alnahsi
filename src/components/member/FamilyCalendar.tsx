import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { upcomingEvents } from "@/lib/gedcom";
import type { PersonRow } from "@/components/tree/PersonCard";

export function FamilyCalendar({ ar }: { ar: boolean }) {
  const [rows, setRows] = useState<PersonRow[]>([]);
  useEffect(() => {
    getSupabase()
      .from("family_members")
      .select("*")
      .then(({ data }) => setRows((data ?? []) as PersonRow[]));
  }, []);
  const events = useMemo(() => upcomingEvents(rows), [rows]);
  const birthdays = events.filter((e) => e.kind === "birthday").slice(0, 12);
  const memorials = events.filter((e) => e.kind === "memorial").slice(0, 8);
  const weddings = events.filter((e) => e.kind === "anniversary").slice(0, 8);

  const Block = ({ title, icon, items }: { title: string; icon: string; items: typeof events }) =>
    items.length === 0 ? null : (
      <div className="premium-card p-5">
        <h3 className="font-arabic text-lg text-navy">
          {icon} {title}
        </h3>
        <ul className="mt-3 divide-y divide-gold/10">
          {items.map((e, i) => (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <span className="font-arabic text-navy">{e.name}</span>
              <span className="text-navy/55">{e.label}</span>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div dir={ar ? "rtl" : "ltr"} className="grid gap-4 md:grid-cols-2">
      <Block title={ar ? "أعمار أفراد العائلة" : "Ages"} icon="🎂" items={birthdays} />
      <Block title={ar ? "ذكرى من رحلوا" : "In memoriam"} icon="🕊" items={memorials} />
      <Block title={ar ? "ذكرى الزواج" : "Anniversaries"} icon="💍" items={weddings} />
      {events.length === 0 && (
        <p className="text-sm text-navy/50">
          {ar ? "لا توجد مناسبات مسجّلة بعد" : "No events yet"}
        </p>
      )}
    </div>
  );
}
