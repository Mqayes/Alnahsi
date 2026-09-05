import { useSiteContent } from "@/lib/site-content";
import { useLang } from "@/lib/i18n/LanguageContext";
import { useState } from "react";
import { SupportModal } from "@/components/site/SupportModal";

/** شريط تنبيه زجاجي أعلى الواجهة الأولى — يُدار من الإعدادات (المربع الإعلاني) */
export function HeroNotice() {
  const sc = useSiteContent();
  const { lang } = useLang();
  const ar = lang !== "en";
  const [open, setOpen] = useState(false);
  if (sc["sec_notice"] === "false") return null;
  const title = sc["notice_title_ar"] || (ar ? "تنبيه للأعضاء" : "Notice");
  const text =
    sc["notice_text_ar"] ||
    (ar
      ? "إذا سجّلت في بوابة العائلة فأرسل لنا رسالة لتفعيل حسابك، وإذا واجهت مشكلة راسلنا."
      : "Registered? Message us to activate your account. Facing an issue? Contact us.");
  const phone = (sc["contact_phone"] || "").replace(/\D/g, "");
  const wa = phone ? `https://wa.me/${phone.startsWith("0") ? "966" + phone.slice(1) : phone}` : "";

  return (
    <>
      <div
        className="animate-fade-in mb-5 flex max-w-2xl flex-col items-stretch gap-3 rounded-2xl border border-[#F0CC60]/50 bg-[rgba(10,20,34,0.62)] px-4 py-3 text-start shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md sm:flex-row sm:items-center"
        dir={ar ? "rtl" : "ltr"}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0CC60]/20 text-lg">
          📣
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-arabic text-base text-[#F0CC60]">{title}</span>
          <span className="block text-xs leading-relaxed text-[#FFF8E6]/85">{text}</span>
        </span>
        <span className="flex shrink-0 gap-2">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-[#F0CC60]/70 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#FFF8E6] hover:bg-white/20"
          >
            {ar ? "✉ رسالة عبر الموقع" : "✉ Message via site"}
          </button>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-gradient-to-br from-[#E2BC4A] to-[#B8860B] px-3 py-1.5 text-xs font-bold text-navy"
            >
              {ar ? "واتساب" : "WhatsApp"}
            </a>
          )}
        </span>
      </div>
      {open && <SupportModal ar={ar} onClose={() => setOpen(false)} />}
    </>
  );
}
