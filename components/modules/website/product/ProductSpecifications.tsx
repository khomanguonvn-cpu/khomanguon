"use client";
import React, { useState, useRef, useEffect } from "react";
import { Detail, Product } from "@/types";
import { Card } from "@/components/ui/card";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

import { CheckCircle2, ChevronDown, ChevronUp, Images, ZoomIn, X } from "lucide-react";

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

const PLACEHOLDER_IMAGE = "/assets/images/placeholders/placeholder.png";

export default function ProductSpecifications({
  product,
}: {
  product: Product;
}) {
  const { language } = useSelector((state: IRootState) => state.settings);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const COLLAPSED_HEIGHT = 280; // px

  // Extract all product images from subProducts
  const allImages = React.useMemo(() => {
    const imgs: string[] = [];
    const seen = new Set<string>();

    // From assets
    if (product?.assets && Array.isArray(product.assets)) {
      product.assets.forEach((a: any) => {
        if (a.type === "image" && a.url) {
          const url = String(a.url).trim();
          if (url && !seen.has(url)) {
            seen.add(url);
            imgs.push(url);
          }
        }
      });
    }

    // From all subProducts options
    product?.subProducts?.forEach((sp) => {
      sp.options?.forEach((opt) => {
        opt.images?.forEach((img) => {
          const url = String(img || "").trim();
          if (url && !seen.has(url)) {
            seen.add(url);
            imgs.push(url);
          }
        });
      });
      // Style image
      if (sp.style?.image) {
        const url = String(sp.style.image).trim();
        if (url && !seen.has(url)) {
          seen.add(url);
          imgs.push(url);
        }
      }
    });

    return imgs;
  }, [product]);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [product.content]);

  const needsCollapse = contentHeight > COLLAPSED_HEIGHT;

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
    <>
      <section className="my-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* Description Column */}
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{t(language, "productDescriptionTab")}</h2>
              <Card className="relative p-6 md:p-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Collapsible content */}
                <div
                  ref={contentRef}
                  className="transition-all duration-500 ease-in-out overflow-hidden"
                  style={{
                    maxHeight: !needsCollapse ? "none" : isExpanded ? `${contentHeight + 40}px` : `${COLLAPSED_HEIGHT}px`,
                  }}
                >
                  {renderDescription()}
                </div>

                {/* Gradient overlay when collapsed */}
                {needsCollapse && !isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none" />
                )}

                {/* Expand/Collapse button */}
                {needsCollapse && (
                  <div className={`flex justify-center ${isExpanded ? "mt-4" : "relative z-10 -mt-4"}`}>
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-semibold transition-all duration-200 border border-primary-200 hover:border-primary-300 shadow-sm hover:shadow-md"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Đọc tất cả
                        </>
                      )}
                    </button>
                  </div>
                )}
              </Card>
            </div>

            {/* Product Images Column */}
            {allImages.length > 0 && (
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Images className="w-5 h-5 text-primary-600" />
                  Ảnh sản phẩm
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightboxImage(img)}
                      className="group relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 hover:border-primary-400 shadow-sm hover:shadow-lg transition-all duration-300 bg-white"
                    >
                      <img
                        src={img}
                        alt={`${product.name} - Ảnh ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg">
                          <ZoomIn className="w-5 h-5 text-slate-700" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt={product.name}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation thumbnails */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-2xl px-4 py-3 overflow-x-auto max-w-[90vw]">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage(img);
                  }}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    lightboxImage === img
                      ? "border-white shadow-lg scale-110"
                      : "border-white/30 hover:border-white/60 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Ảnh ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}