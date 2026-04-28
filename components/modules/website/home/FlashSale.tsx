"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "../../custom/ProductCard";
import { Product } from "@/types";
import { Zap, ArrowRight } from "lucide-react";
import { t } from "@/lib/i18n";

interface FlashSaleProps {
  products: Product[];
  language?: "vi" | "en";
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor(distance / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-2">
      {[
        { value: timeLeft.hours, label: "Giờ" },
        { value: timeLeft.minutes, label: "Phút" },
        { value: timeLeft.seconds, label: "Giây" },
      ].map((item, i) => (
        <React.Fragment key={item.label}>
          <div className="countdown-box">
            <span className="countdown-number">{pad(item.value)}</span>
            <span className="countdown-label">{item.label}</span>
          </div>
          {i < 2 && (
            <span className="text-white font-bold text-2xl animate-count-down">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function FlashSale({ products, language = "vi" }: FlashSaleProps) {
  // Target: 24 hours from now
  const targetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Take only first 8 products for flash sale
  const saleProducts = products.slice(0, 8);

  if (saleProducts.length === 0) return null;

  return (
    <section className="py-12 bg-flash-sale rounded-2xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Flash Icon */}
            <div className="flex items-center gap-2">
              <Zap className="h-8 w-8 text-white fill-white" />
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {t(language, "flashSale")}
              </h2>
            </div>

            {/* Countdown Timer */}
            <div className="flex">
              <CountdownTimer targetDate={targetDate} />
            </div>
          </div>

          {/* View All */}
          <Link
            href="/products?sale=true"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-all backdrop-blur-sm"
          >
            <span>{t(language, "sectionViewAll")}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile Countdown removed - now shown inline above */}

        {/* Products Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
          {saleProducts.map((product, idx) => (
            <div key={product._id || `flash-sale-${idx}`} className="stagger-item">
              <ProductCard item={product} loading={false} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
