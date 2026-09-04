import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useLang } from "@/lib/i18n/LanguageContext";
import { translations, t } from "@/lib/i18n/translations";
import { Ornament } from "@/components/site/Ornament";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Reach the Family — Al Bukhuf Alnahsi" },
      {
        name: "description",
        content: "Correspondence and partnerships with the Al Bukhuf Alnahsi family office.",
      },
      { property: "og:title", content: "Reach the Family — Al Bukhuf Alnahsi" },
      { property: "og:description", content: "For correspondence and partnerships." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(1000),
});

function ContactPage() {
  const { lang } = useLang();
  const c = translations.contact;
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      message: fd.get("message"),
    });
    if (!parsed.success) {
      setError(lang === "en" ? "Please check your entries." : "يرجى مراجعة المدخلات.");
      return;
    }
    setError(null);
    setSent(true);
  };

  return (
    <section className="bg-parchment text-navy pt-44 pb-32 md:pt-52">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <div className="eyebrow">{lang === "en" ? "Correspondence" : "مراسلة"}</div>
          <h1 className="mt-6 text-5xl md:text-6xl text-navy">{t(c.title, lang)}</h1>
          <Ornament className="mt-6" />
          <p className="mt-6 italic text-navy/75">{t(c.sub, lang)}</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-16 space-y-6 border border-gold/30 bg-cream p-8 md:p-12 text-navy"
        >
          {sent ? (
            <div className="py-16 text-center">
              <Ornament className="mb-6" />
              <p className="font-serif-display text-2xl italic text-navy">{t(c.sent, lang)}</p>
            </div>
          ) : (
            <>
              <Field label={t(c.name, lang)} name="name" />
              <Field label={t(c.email, lang)} name="email" type="email" />
              <Field label={t(c.message, lang)} name="message" textarea />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="pt-2 text-center">
                <button type="submit" className="btn-gold">
                  {t(c.send, lang)}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-12 text-center font-serif-display text-sm uppercase tracking-[0.22em] text-gold">
          {t(c.office, lang)}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  textarea = false,
}: {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-serif-display text-xs uppercase tracking-[0.22em] text-navy/80">
        {label}
      </span>
      {textarea ? (
        <textarea
          name={name}
          required
          rows={5}
          maxLength={1000}
          className="w-full border border-border bg-parchment px-4 py-3 font-body text-base text-navy outline-none transition-colors focus:border-gold"
        />
      ) : (
        <input
          type={type}
          name={name}
          required
          maxLength={255}
          className="w-full border border-border bg-parchment px-4 py-3 font-body text-base text-navy outline-none transition-colors focus:border-gold"
        />
      )}
    </label>
  );
}
