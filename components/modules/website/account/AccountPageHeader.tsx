import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountPageHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  gradient?: string;
  className?: string;
};

export default function AccountPageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  gradient = "from-primary-600 via-primary-500 to-indigo-600",
  className,
}: AccountPageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 sm:p-5 text-white shadow-md mb-4",
        gradient,
        className
      )}
    >
      {/* Subtle pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.8) 0%, transparent 50%)",
        }}
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15 shadow backdrop-blur-md">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-xs sm:text-sm text-white/75 line-clamp-1">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
