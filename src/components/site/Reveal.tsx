import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  direction = "up",
  fadeOnly = false,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right";
  fadeOnly?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const show = () => {
      timeoutId = setTimeout(() => setVisible(true), delay);
    };

    // Show immediately if already in viewport (fixes images stuck hidden)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      show();
      return () => clearTimeout(timeoutId);
    }

    if (typeof IntersectionObserver === "undefined") {
      show();
      return () => clearTimeout(timeoutId);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px 10% 0px" },
    );

    io.observe(el);

    const fallbackId = setTimeout(() => setVisible(true), 300 + delay);

    return () => {
      io.disconnect();
      clearTimeout(timeoutId);
      clearTimeout(fallbackId);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      data-direction={fadeOnly ? "up" : direction}
      className={`reveal ${fadeOnly ? "reveal-fade-only" : ""} ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
