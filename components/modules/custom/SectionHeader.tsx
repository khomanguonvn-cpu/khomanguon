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
          <p className="text-slate-500 text-sm mt-2">{subtitle}</p>
        )}

        {/* Angular accent line */}
        <div className="mt-4 flex items-center gap-0">
          <div className="h-1 w-16 bg-gradient-to-r from-primary-600 to-indigo-500" style={{ clipPath: "polygon(0 0, calc(100% - 4px) 0, 100% 100%, 0 100%)" }} />
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      </div>

      {/* View All Link — angular button style */}
      {viewAllHref && viewAllLabel && (
        <Link
          href={viewAllHref}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-primary-600 border-2 border-primary-500 hover:bg-primary-600 hover:text-white transition-all duration-200 group clip-angular-sm"
        >
          <span>{viewAllLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
