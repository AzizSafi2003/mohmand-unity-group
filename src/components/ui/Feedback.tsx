import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-sand bg-surface/60 px-6 py-14 text-center",
        className
      )}
    >
      {icon && <div className="text-pine-300">{icon}</div>}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-faint">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center", className)}>
      {eyebrow && <span className="eyebrow mb-3">{eyebrow}</span>}
      <h2 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-base text-ink-faint">{description}</p>}
    </div>
  );
}
