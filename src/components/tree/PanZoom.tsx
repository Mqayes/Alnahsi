import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** لوحة قابلة للسحب والتكبير باللمس والماوس — تعمل في RTL بلا مشاكل */
export function PanZoom({
  children,
  zoom,
  onZoom,
  fitKey,
  ar,
}: {
  children: ReactNode;
  zoom: number;
  onZoom: (z: number) => void;
  fitKey: unknown;
  ar: boolean;
}) {
  const vp = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [full, setFull] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(
    null,
  );
  const pinch = useRef<{ d: number; z: number } | null>(null);

  const clamp = (z: number) => Math.min(2.5, Math.max(0.3, z));

  const fit = useCallback(() => {
    const v = vp.current,
      c = inner.current;
    if (!v || !c) return;
    const cw = c.scrollWidth,
      ch = c.scrollHeight,
      vw = v.clientWidth,
      vh = v.clientHeight;
    const z = clamp(Math.min(1.2, (vw - 24) / Math.max(cw, 1), (vh - 24) / Math.max(ch, 1)));
    onZoom(z);
    setPos({ x: (vw - cw * z) / 2, y: Math.max(12, (vh - ch * z) / 2) });
  }, [onZoom]);

  useEffect(() => {
    const t = setTimeout(fit, 60);
    return () => clearTimeout(t);
  }, [fit, fitKey, full]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [full]);

  const onDown = (e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).closest("button"))
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (d.moved) setPos({ x: d.px + dx, y: d.py + dy });
  };
  const onUp = () => {
    drag.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const nz = clamp(zoom * (e.deltaY < 0 ? 1.1 : 0.9));
      const rect = vp.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      setPos({ x: mx - ((mx - pos.x) * nz) / zoom, y: my - ((my - pos.y) * nz) / zoom });
      onZoom(nz);
    } else {
      setPos((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinch.current = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: zoom };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      onZoom(clamp((pinch.current.z * d) / pinch.current.d));
    }
  };
  const onTouchEnd = () => {
    pinch.current = null;
  };

  return (
    <div className="relative">
      <div
        ref={vp}
        dir="ltr"
        className={`cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing ${full ? "fixed inset-0 z-[200] h-[100dvh] w-screen bg-parchment" : "premium-card h-[70vh]"}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={inner}
          dir={ar ? "rtl" : "ltr"}
          className="absolute left-0 top-0 w-max origin-top-left will-change-transform"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})` }}
        >
          {children}
        </div>
      </div>
      <div
        className={`pointer-events-none flex gap-2 ${full ? "fixed left-3 top-3 z-[201]" : "absolute bottom-10 left-3"}`}
      >
        <button
          onClick={fit}
          className="pointer-events-auto rounded-md border border-gold/40 bg-white/95 px-3 py-1.5 text-xs text-navy shadow hover:bg-parchment"
        >
          {ar ? "⤢ ملاءمة" : "⤢ Fit"}
        </button>
        <button
          onClick={() => setFull((v) => !v)}
          className="pointer-events-auto rounded-md border border-gold/40 bg-white/95 px-3 py-1.5 text-xs text-navy shadow hover:bg-parchment"
        >
          {full ? (ar ? "✕ خروج" : "✕ Exit") : ar ? "⛶ ملء الشاشة" : "⛶ Fullscreen"}
        </button>
        <button
          onClick={() => onZoom(clamp(zoom + 0.15))}
          className="pointer-events-auto rounded-md border border-gold/40 bg-white/95 px-3 py-1.5 text-xs text-navy shadow hover:bg-parchment"
        >
          ＋
        </button>
        <button
          onClick={() => onZoom(clamp(zoom - 0.15))}
          className="pointer-events-auto rounded-md border border-gold/40 bg-white/95 px-3 py-1.5 text-xs text-navy shadow hover:bg-parchment"
        >
          －
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-navy/40">
        {ar ? "اسحب بإصبعك للتحريك · قرّب بإصبعين للتكبير" : "Drag to move · pinch to zoom"}
      </p>
    </div>
  );
}
