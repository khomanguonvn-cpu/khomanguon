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
        "flex items-center justify-between gap-4",
        className
      )}
    >
      {/* Left: Badge + Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Accent bar */}
        <div className="h-6 w-1 rounded-full bg-primary-600 shrink-0" />

        <div className="min-w-0">
          {badge && (
            <div className="mb-0.5 flex items-center gap-1.5">
              {badgeIcon && <span className="flex-shrink-0 text-primary-600">{badgeIcon}</span>}
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                {badge}
              </span>
            </div>
          )}
          <h2
            className={cn(
              "text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-tight",
              titleClassName
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs leading-5 text-slate-500 line-clamp-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: View all */}
      {viewAllHref && viewAllLabel && (
        <Link
          href={viewAllHref}
          className="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          <span>{viewAllLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
