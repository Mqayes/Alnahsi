import { useEffect, useState } from "react";

/** يسجّل Service Worker ويعرض تلميح التثبيت على iOS مرة واحدة */
export function PwaSetup() {
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("alnahsi_pwa_hint") === "1";
    } catch {
      /* ignore */
    }
    if (isIos && !standalone && !dismissed) setTimeout(() => setHint(true), 3000);
  }, []);

  if (!hint) return null;
  const close = () => {
    setHint(false);
    try {
      localStorage.setItem("alnahsi_pwa_hint", "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-x-3 bottom-3 z-[400] rounded-2xl border border-gold/40 bg-white p-4 shadow-2xl md:mx-auto md:max-w-md"
    >
      <div className="flex items-start gap-3">
        <img src="/icon-192.png" alt="" className="h-11 w-11 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="font-arabic text-navy">ثبّت تطبيق العائلة على جهازك</div>
          <p className="mt-1 text-xs leading-relaxed text-navy/65">
            اضغط زر المشاركة <span className="mx-1 rounded bg-parchment px-1">􀈂</span> في سفاري ثم
            اختر <b>«إضافة إلى الشاشة الرئيسية»</b>.
          </p>
        </div>
        <button onClick={close} className="text-xl text-navy/40 hover:text-navy">
          ✕
        </button>
      </div>
    </div>
  );
}
