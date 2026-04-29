import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  viewAllLabel?: string;
  viewAllHref?: string;
  className?: string;
  titleClassName?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  badge,
  badgeIcon,
  viewAllLabel,
  viewAllHref,
  className,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          {badge && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {badgeIcon && <span className="flex-shrink-0">{badgeIcon}</span>}
              {badge}
            </span>
          )}
          <h2
            className={cn(
              "text-2xl font-black tracking-tight text-slate-950 md:text-3xl",
              titleClassName
            )}
          >
            {title}
          </h2>
        </div>

        {subtitle && (
          <p className="max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>
        )}

        <div className="mt-4 flex items-center gap-0">
          <div className="h-1 w-14 rounded-full bg-primary-600" />
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      </div>

      {viewAllHref && viewAllLabel && (
        <Link
          href={viewAllHref}
          className="group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition-all duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
        >
          <span>{viewAllLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
