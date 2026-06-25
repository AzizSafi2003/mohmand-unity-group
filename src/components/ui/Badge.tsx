import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "pine" | "brass" | "paid" | "partial" | "unpaid" | "pending" | "approved" | "rejected";

const tones: Record<Tone, string> = {
  neutral: "bg-parchment-deep text-ink-soft",
  pine: "bg-pine-100 text-pine-700",
  brass: "bg-brass/15 text-brass-dark",
  paid: "bg-pine-100 text-pine-700",
  partial: "bg-brass/15 text-brass-dark",
  unpaid: "bg-clay/12 text-clay",
  pending: "bg-brass/15 text-brass-dark",
  approved: "bg-pine-100 text-pine-700",
  rejected: "bg-danger/12 text-danger",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
