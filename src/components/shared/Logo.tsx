import { cn } from "@/lib/utils";

/**
 * Original brand mark for the platform: a stylised lineage tree (three
 * generations branching) enclosed in a kilim diamond — the same geometric
 * language as the section dividers. Drawn from scratch (no third-party logo).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0"
        role="img"
        aria-label="Mohmand Unity Group"
      >
        {/* kilim diamond frame */}
        <path
          d="M20 2 38 20 20 38 2 20Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-pine"
        />
        <path
          d="M20 8 32 20 20 32 8 20Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-brass"
        />
        {/* lineage tree: a root that splits to two then four nodes */}
        <g className="text-pine" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="20" y1="29" x2="20" y2="22" />
          <line x1="20" y1="22" x2="14" y2="17" />
          <line x1="20" y1="22" x2="26" y2="17" />
        </g>
        <g className="text-brass" fill="currentColor">
          <circle cx="20" cy="30" r="2.1" />
          <circle cx="14" cy="16" r="2.1" />
          <circle cx="26" cy="16" r="2.1" />
        </g>
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
          Mohmand
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-brass-dark">
          Unity Group
        </span>
      </span>
    </span>
  );
}
