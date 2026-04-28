import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountPageHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Tailwind gradient classes, e.g. "from-indigo-500 via-violet-500 to-purple-600" */
  gradient?: string;
  className?: string;
};

export default function AccountPageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  gradient = "from-primary-600 via-primary-500 to-emerald-500",
  className,
}: AccountPageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br p-5 sm:p-7 lg:p-8 text-white shadow-xl shadow-slate-900/5",
        gradient,
        className
      )}
    >
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

      {/* Decorative grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-lg backdrop-blur-md sm:h-14 sm:w-14">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-white/80 sm:text-base">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
