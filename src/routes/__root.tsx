import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { Header } from "@/components/site/Header";
import { MaintenanceGate } from "@/components/site/MaintenanceGate";
import { PwaSetup } from "@/components/site/PwaSetup";
import { Footer } from "@/components/site/Footer";

// صفحتا 404 والخطأ قد تُصيَّران خارج LanguageProvider، لذا نقرأ اللغة مباشرة.
function readLangSafe(): "ar" | "en" {
  if (typeof window === "undefined") return "ar";
  try {
    const stored = localStorage.getItem("alnahsi.lang");
    if (stored === "en" || stored === "ar") return stored;
  } catch {
    /* noop */
  }
  return "ar";
}

function NotFoundComponent() {
  const ar = readLangSafe() === "ar";

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {ar ? "الصفحة غير موجودة" : "Page not found"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {ar
            ? "الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
            : "The page you're looking for doesn't exist or has been moved."}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {ar ? "العودة للرئيسية" : "Go home"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const ar = readLangSafe() === "ar";

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {ar ? "تعذّر تحميل هذه الصفحة" : "This page didn't load"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ar
            ? "حدث خلل من طرفنا. جرّب التحديث أو العودة إلى الصفحة الرئيسية."
            : "Something went wrong on our end. You can try refreshing or head back home."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {ar ? "إعادة المحاولة" : "Try again"}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {ar ? "الصفحة الرئيسية" : "Go home"}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { name: "theme-color", content: "#14243A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "الناهسي" },
      { name: "mobile-web-app-capable", content: "yes" },
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The House of Al Bukhuf Alnahsi — A Family Heritage" },
      {
        name: "description",
        content:
          "The living digital archive of the Al Bukhuf Alnahsi family. A century of generations, values, and the businesses we built — told with warmth and dignity.",
      },
      { name: "author", content: "The Al Bukhuf Alnahsi Family" },
      { property: "og:title", content: "The House of Al Bukhuf Alnahsi" },
      {
        property: "og:description",
        content: "A name built over generations.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alnahsi.com/" },
      { property: "og:image", content: "https://alnahsi.com/og-image.jpg" },
      { property: "og:image:alt", content: "The House of Al Bukhuf Alnahsi" },
      { property: "og:locale", content: "ar_SA" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:site_name", content: "Al Bukhuf Alnahsi" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://alnahsi.com/og-image.jpg" },
      { name: "theme-color", content: "#14243A" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "canonical", href: "https://alnahsi.com/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Cinzel:wght@400;500;600;700&family=Amiri:wght@400;700&family=Reem+Kufi:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// يُنفَّذ قبل أول رسم للصفحة: يضبط اللغة والاتجاه من التخزين المحلي
// فيمنع وميض الانقلاب من LTR إلى RTL الذي كان يظهر عند كل تحميل.
const LANG_BOOTSTRAP = `(function(){try{
var l=localStorage.getItem("alnahsi.lang");
if(l!=="en"&&l!=="ar")l="ar";
var d=document.documentElement;
d.lang=l;d.dir=l==="ar"?"rtl":"ltr";
d.setAttribute("data-lang",l);
}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOTSTRAP }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Header />
        <main className="min-h-screen">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <MaintenanceGate>
            <Outlet />
          </MaintenanceGate>
        </main>
        <Footer />
        <PwaSetup />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
