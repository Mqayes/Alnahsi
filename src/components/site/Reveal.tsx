import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

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
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" },
    );

    io.observe(el);

    return () => {
      io.disconnect();
      clearTimeout(timeoutId);
    };
  }, [delay]);

  const getTransform = (): string => {
    if (visible || fadeOnly) return "none";
    if (direction === "up") return "translateY(52px)";
    if (direction === "left") return "translateX(-52px)";
    if (direction === "right") return "translateX(52px)";
    return "none";
  };

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: getTransform(),
    transition: `opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)`,
    transitionDelay: "0ms",
    willChange: visible ? "auto" : "opacity, transform",
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
