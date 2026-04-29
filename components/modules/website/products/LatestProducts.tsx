"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { Rating } from "@mui/material";
import { Skeleton } from "@/components/ui/skeleton";
import { getRating } from "@/lib/utils";
import { Product } from "@/types";
import CurrencyFormat from "../../custom/CurrencyFormat";

const FALLBACK_IMAGE = "/assets/images/placeholders/placeholder.png";

export default function LatestProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProducts = () => {
      setLoading(true);
      axios
        .get("/api/products")
        .then((response) => {
          setProducts(response.data.data || []);
        })
        .catch(() => {
          setProducts([]);
        })
        .finally(() => {
          setLoading(false);
        });
    };

    getProducts();
  }, []);

  if (loading) {
    return (
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`latest-skeleton-${index}`} className="flex gap-3">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {products.slice(0, 5).map((item: Product, index: number) => {
        const option = item.subProducts?.[0]?.options?.[0];
        const imageSrc =
          option?.images?.[0] ||
          `/assets/images/placeholders/${item.category?.slug || "placeholder"}.png` ||
          FALLBACK_IMAGE;
        const reviews = Array.isArray(item.reviews) ? item.reviews : [];

        return (
          <Link
            key={item._id || item.slug || index}
            href={`/products/${item.slug}`}
            className="flex gap-3 rounded-lg border border-slate-100 bg-white p-2 transition-all hover:border-primary-200 hover:shadow-sm"
          >
            <Image
              width={72}
              height={72}
              alt={item.name}
              src={imageSrc}
              className="h-16 w-16 rounded-md object-cover"
              unoptimized
            />

            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                {item.name}
              </h3>
              <div className="mt-1 text-sm font-black text-primary-700">
                <CurrencyFormat value={Number(option?.price || 0)} />
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Rating
                  name={`latest-product-${item.slug}`}
                  value={getRating({ ...item, reviews })}
                  precision={0.5}
                  size="small"
                  readOnly
                />
                <span className="text-xs font-semibold text-slate-400">
                  ({reviews.length})
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
