import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

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
    <div className={cn("section-header", className)}>
      <div className="flex flex-col">
        {/* Badge + Title Row */}
        <div className="flex items-center gap-3 mb-1">
          {badge && (
            <span className="section-badge">
              {badgeIcon && <span className="flex-shrink-0">{badgeIcon}</span>}
              {badge}
            </span>
          )}
          <h2 className={cn("section-title", titleClassName)}>{title}</h2>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        )}

        {/* Decorative line */}
        <div className="mt-3 flex items-center gap-3">
          <div className="h-0.5 w-12 bg-primary-500 rounded-full" />
          <div className="h-0.5 flex-1 bg-slate-200 rounded-full" />
        </div>
      </div>

      {/* View All Link */}
      {viewAllHref && viewAllLabel && (
        <Link
          href={viewAllHref}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group"
        >
          <span>{viewAllLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
