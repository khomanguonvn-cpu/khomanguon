"use client";
import React from "react";
import { Detail, Product } from "@/types";
import { Card } from "@/components/ui/card";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

import { CheckCircle2 } from "lucide-react";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Strips dangerous tags and event handler attributes.
 */
function sanitizeHtml(input: string): string {
  let html = String(input || "");
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  html = html.replace(/<object[\s\S]*?<\/object>/gi, "");
  html = html.replace(/<embed[\s\S]*?>/gi, "");
  html = html.replace(/<form[\s\S]*?<\/form>/gi, "");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<link[\s\S]*?>/gi, "");
  html = html.replace(/<meta[\s\S]*?>/gi, "");
  html = html.replace(/<base[\s\S]*?>/gi, "");
  html = html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  html = html.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");
  html = html.replace(/(?:href|src|action)\s*=\s*["']?\s*javascript\s*:/gi, 'data-blocked="');
  return html;
}

export default function ProductSpecifications({
  product,
}: {
  product: Product;
}) {
  const { language } = useSelector((state: IRootState) => state.settings);

  const renderDescription = () => {
    const content = sanitizeHtml(product.content || "");
    const hasBlockTags = /<\/?(p|div|ul|ol|li|h[1-6]|table|blockquote)[^>]*>/i.test(content);

    if (hasBlockTags) {
      return (
        <div
          className="prose prose-slate max-w-none text-[15px] leading-relaxed text-slate-600"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length === 0) return null;

    return (
      <ul className="flex flex-col gap-3.5">
        {lines.map((line, idx) => (
          <li key={idx} className="flex items-start gap-3.5 text-[15px] leading-relaxed text-slate-700 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-colors">
            <div className="bg-white rounded-full p-0.5 shadow-sm border border-emerald-100 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
            </div>
            <span dangerouslySetInnerHTML={{ __html: line }} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className="my-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{t(language, "productDescriptionTab")}</h2>
          <Card className="p-6 md:p-8 rounded-xl border border-slate-200 bg-white shadow-sm">
            {renderDescription()}
          </Card>
        </div>
      </div>
    </section>
  );
}