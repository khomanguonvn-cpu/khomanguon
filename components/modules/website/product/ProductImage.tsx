"use client";
import { cn } from "@/lib/utils";
import { Product } from "@/types";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import { m } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export default function ProductImage({
  className,
  product,
  images,
  active,
}: {
  className: string;
  product: Product;
  images: string[];
  active: number;
}) {
  const fallbackCandidates = useMemo(() => {
    const categoryPlaceholder = `/assets/images/placeholders/${product?.category?.slug || "placeholder"}.png`;
    const defaultPlaceholder = "/assets/images/placeholders/placeholder.png";
    return Array.from(new Set([categoryPlaceholder, defaultPlaceholder]));
  }, [product?.category?.slug]);

  const normalizedImages = useMemo(() => {
    const source = Array.isArray(images) ? images : [];
    const cleaned = source
      .map((item) => String(item || "").trim())
      .map((item) => {
        if (!item) return "";
        if (item.startsWith("http://") || item.startsWith("https://")) {
          return encodeURI(item);
        }
        if (item.startsWith("//")) {
          return encodeURI(`https:${item}`);
        }
        if (item.startsWith("/")) {
          return encodeURI(item);
        }
        return encodeURI(`/${item}`);
      })
      .filter(Boolean);

    if (cleaned.length === 0) {
      return fallbackCandidates;
    }

    return Array.from(new Set(cleaned));
  }, [images, fallbackCandidates]);

  const [changeImage, setChangeImage] = useState(
    normalizedImages[0] || fallbackCandidates[0]
  );
  const [loaded, setLoaded] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const displayImage =
    fallbackIndex === 0
      ? changeImage || fallbackCandidates[0]
      : fallbackCandidates[fallbackIndex - 1] || fallbackCandidates[fallbackCandidates.length - 1];

  useEffect(() => {
    setFallbackIndex(0);
    const nextImage = normalizedImages[active] || normalizedImages[0] || fallbackCandidates[0];
    setChangeImage((current) => (current === nextImage ? current : nextImage));
  }, [active, normalizedImages, fallbackCandidates]);

  const previousDisplayImageRef = useRef(displayImage);
  useEffect(() => {
    if (previousDisplayImageRef.current !== displayImage) {
      setLoaded(false);
      previousDisplayImageRef.current = displayImage;
    }
  }, [displayImage]);

  const currentIndex = Math.max(0, normalizedImages.indexOf(changeImage));
  const hasMultiple = normalizedImages.length > 1;
  const selectImage = useCallback((image: string) => {
    setFallbackIndex(0);
    if (image === changeImage) return;
    setLoaded(false);
    setChangeImage(image);
  }, [changeImage]);

  const prevImage = useCallback(() => {
    const idx = normalizedImages.indexOf(changeImage);
    if (idx > 0) selectImage(normalizedImages[idx - 1]);
  }, [changeImage, normalizedImages, selectImage]);

  const nextImage = useCallback(() => {
    const idx = normalizedImages.indexOf(changeImage);
    if (idx >= 0 && idx < normalizedImages.length - 1) {
      selectImage(normalizedImages[idx + 1]);
    }
  }, [changeImage, normalizedImages, selectImage]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prevImage, nextImage]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <m.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm group"
      >
        {!loaded && (
          <div className="absolute inset-0 skeleton animate-pulse z-20 bg-gradient-to-br from-slate-100 to-slate-200" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[5] pointer-events-none" />

        {hasMultiple && (
          <>
            <m.button
              initial={{ opacity: 0 }}
              animate={{ opacity: currentIndex > 0 ? 1 : 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevImage}
              disabled={currentIndex === 0}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/95 backdrop-blur-md shadow-xl hover:bg-white transition-all duration-200",
                currentIndex === 0 && "opacity-0 cursor-not-allowed"
              )}
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </m.button>
            <m.button
              initial={{ opacity: 0 }}
              animate={{ opacity: currentIndex < normalizedImages.length - 1 ? 1 : 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextImage}
              disabled={currentIndex === normalizedImages.length - 1}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/95 backdrop-blur-md shadow-xl hover:bg-white transition-all duration-200",
                currentIndex === normalizedImages.length - 1 && "opacity-0 cursor-not-allowed"
              )}
              aria-label="Ảnh sau"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </m.button>
          </>
        )}

        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-slate-700 text-xs font-semibold backdrop-blur-sm shadow-lg">
          <ZoomIn className="h-3.5 w-3.5" />
          <span>Phóng to</span>
        </div>

        {hasMultiple && (
          <m.div
            key={currentIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 right-3 z-10 px-3.5 py-1.5 rounded-full bg-slate-900/80 text-white text-xs font-semibold backdrop-blur-sm shadow-lg"
          >
            {currentIndex + 1} / {normalizedImages.length}
          </m.div>
        )}

        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {normalizedImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => selectImage(normalizedImages[idx])}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                  idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                )}
                aria-label={`Xem ảnh ${idx + 1}`}
              />
            ))}
          </div>
        )}

        <Zoom zoomMargin={16}>
          <m.img
            key={displayImage}
            src={displayImage}
            alt={product.name}
            className="w-full aspect-square object-contain cursor-zoom-in bg-white"
            onLoad={() => setLoaded(true)}
            onError={() => {
              if (fallbackIndex < fallbackCandidates.length) {
                setLoaded(false);
                setFallbackIndex((prev) => prev + 1);
                return;
              }
              setLoaded(true);
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.96 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </Zoom>
      </m.div>

      {hasMultiple && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {normalizedImages.map((item: string, idx: number) => (
            <m.button
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => selectImage(item)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-xl border-2 transition-all duration-200 overflow-hidden group/thumb",
                changeImage === item
                  ? "border-primary-500 ring-2 ring-primary-500/20 shadow-md"
                  : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
              )}
              style={{
                backgroundImage: `url(${item})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
              }}
              aria-label={`Xem ảnh ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
