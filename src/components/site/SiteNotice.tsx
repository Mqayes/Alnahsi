import { useEffect, useState } from "react";
import { useSiteContent } from "@/lib/site-content";
import { useLang } from "@/lib/i18n/LanguageContext";
import { SupportModal } from "@/components/site/SupportModal";

/** إعلان يظهر لكل زائر في كل الصفحات — يُدار من الإعدادات (المربع الإعلاني) */
export function SiteNotice() {
  const sc = useSiteContent();
  const { lang } = useLang();
  const ar = lang !== "en";
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);

  const version = (sc["notice_title_ar"] ?? "") + (sc["notice_text_ar"] ?? "");
  useEffect(() => {
    try {
      setHidden(localStorage.getItem("alnahsi_notice_hide") === version);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [version]);

  if (!ready || hidden || sc["sec_notice"] === "false") return null;

  const title = sc["notice_title_ar"] || (ar ? "تنبيه للأعضاء" : "Notice");
  const text =
    sc["notice_text_ar"] ||
    (ar
      ? "إذا سجّلت في بوابة العائلة فأرسل لنا رسالة لتفعيل حسابك، وإذا واجهت مشكلة راسلنا."
      : "Registered? Message us to activate your account.");
  const phone = (sc["contact_phone"] || "").replace(/\D/g, "");
  const wa = phone ? `https://wa.me/${phone.startsWith("0") ? "966" + phone.slice(1) : phone}` : "";

  const close = () => {
    setHidden(true);
    try {
      localStorage.setItem("alnahsi_notice_hide", version);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div
        dir={ar ? "rtl" : "ltr"}
        className="border-b border-gold/30 bg-gradient-to-l from-[#FFF3C4] via-[#FFF8E6] to-[#FAF0D0]"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 md:px-6">
          <span className="text-lg">📣</span>
          <div className="min-w-0 flex-1">
            <span className="font-arabic text-sm font-bold text-navy md:text-base">{title}</span>
            <span className="mx-2 hidden text-navy/40 md:inline">·</span>
            <span className="block text-xs text-navy/70 md:inline md:text-sm">{text}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy/90"
            >
              {ar ? "✉ راسلنا" : "✉ Message"}
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
            <button
              onClick={close}
              aria-label="close"
              className="px-1 text-lg text-navy/40 hover:text-navy"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      {open && <SupportModal ar={ar} onClose={() => setOpen(false)} />}
    </>
  );
}
