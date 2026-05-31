export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold" />
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path
          d="M13 1l2.4 5.2L21 7.2l-3.8 4 .9 5.6L13 14.5 7.9 16.8l.9-5.6L5 7.2l5.6-1z"
          stroke="currentColor"
          strokeWidth="0.7"
          className="text-gold"
          fill="none"
        />
        <circle cx="13" cy="13" r="2" className="fill-gold" />
      </svg>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold" />
    </div>
  );
}