type Props = {
  year: string;
  motif?: "star" | "palm" | "camel" | "wheat" | "gear" | "mountain";
  className?: string;
};

const G = "#CFA93A";
const MOTIFS: Record<NonNullable<Props["motif"]>, React.ReactNode> = {
  star: (
    <path
      d="M60 22l9 23 24 2-18 16 6 24-21-13-21 13 6-24-18-16 24-2z"
      fill="none"
      stroke={G}
      strokeWidth="1.6"
    />
  ),
  palm: (
    <g fill="none" stroke={G} strokeWidth="1.6" strokeLinecap="round">
      <path d="M60 98V54" />
      <path d="M60 54c-14-2-26-12-30-26 14 2 25 10 30 26z" />
      <path d="M60 54c14-2 26-12 30-26-14 2-25 10-30 26z" />
      <path d="M60 52c-10-8-14-22-9-36 8 8 12 22 9 36z" />
      <path d="M60 52c10-8 14-22 9-36-8 8-12 22-9 36z" />
    </g>
  ),
  camel: (
    <g fill={G} stroke="none">
      <path d="M22 84c2-9 6-16 12-20 3-2 4-7 5-12 1-6 5-10 11-10 5 0 8 3 10 7 3-1 6-1 9 0 4-4 8-6 13-5 6 1 10 6 12 12l4 2c3 1 5 3 6 6l1 9-4 0-2-7-4-2 0 8-3 22h-4l2-20-3-1-4 5 2 16h-4l-3-15c-4 2-8 2-12 1l-2 14h-4l1-15c-3-1-6-3-8-6l-3 6 1 15h-4l-2-14c-3 0-6-1-8-3-1 2-1 4-2 6l1 11h-4l-1-10z" />
      <path d="M96 46c2-2 5-3 7-2l3 6-4 1-2-3-3 1z" />
    </g>
  ),
  wheat: (
    <g fill="none" stroke={G} strokeWidth="1.6" strokeLinecap="round">
      <path d="M60 100V44" />
      <path d="M60 60c-8 0-14-6-14-14 8 0 14 6 14 14zM60 60c8 0 14-6 14-14-8 0-14 6-14 14zM60 74c-8 0-14-6-14-14 8 0 14 6 14 14zM60 74c8 0 14-6 14-14-8 0-14 6-14 14zM60 88c-8 0-14-6-14-14 8 0 14 6 14 14zM60 88c8 0 14-6 14-14-8 0-14 6-14 14z" />
    </g>
  ),
  gear: (
    <g fill="none" stroke={G} strokeWidth="1.6">
      <circle cx="60" cy="60" r="12" />
      <circle cx="60" cy="60" r="26" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={60 + 26 * Math.cos(a)}
            y1={60 + 26 * Math.sin(a)}
            x2={60 + 34 * Math.cos(a)}
            y2={60 + 34 * Math.sin(a)}
          />
        );
      })}
    </g>
  ),
  mountain: (
    <g fill="none" stroke={G} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M18 92l22-36 12 18 14-30 20 48z" />
      <path d="M40 56l6 8 6-6" />
    </g>
  ),
};

export function HeritagePlate({ year, motif = "star", className = "" }: Props) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: "linear-gradient(160deg,#1A2E2A 0%,#14243A 60%,#0F1B2C 100%)" }}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.16]"
        viewBox="0 0 120 120"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="hp" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M12 0L24 6V18L12 24L0 18V6Z" fill="none" stroke={G} strokeWidth=".6" />
            <path d="M12 4L20 8V16L12 20L4 16V8Z" fill="none" stroke={G} strokeWidth=".4" />
          </pattern>
        </defs>
        <rect width="120" height="120" fill="url(#hp)" />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(240,204,96,.22),transparent_60%)]" />
      <svg
        className="absolute left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-[58%]"
        viewBox="0 0 120 120"
      >
        <circle cx="60" cy="60" r="54" fill="none" stroke={G} strokeWidth=".8" opacity=".5" />
        <circle cx="60" cy="60" r="48" fill="none" stroke={G} strokeWidth=".5" opacity=".35" />
        {MOTIFS[motif]}
      </svg>
      <div className="absolute inset-x-0 bottom-4 text-center">
        <span className="hero-kufi text-3xl text-[#F0CC60] drop-shadow-[0_2px_10px_rgba(0,0,0,.5)] md:text-4xl">
          {year}
        </span>
        <div className="mx-auto mt-1 h-px w-12 bg-gradient-to-r from-transparent via-[#F0CC60] to-transparent" />
      </div>
      <span className="absolute right-0 top-0 h-6 w-6 border-r border-t border-[#F0CC60]/70" />
      <span className="absolute bottom-0 left-0 h-6 w-6 border-b border-l border-[#F0CC60]/70" />
    </div>
  );
}
