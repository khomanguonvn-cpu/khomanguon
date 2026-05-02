"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Sparkles } from "lucide-react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { Product } from "@/types";
import { t } from "@/lib/i18n";
import Container from "../../custom/Container";
import ProductCard from "../../custom/ProductCard";
import SectionHeader from "../../custom/SectionHeader";

export default function FeaturesProducts() {
  const [loading, setLoading] = useState(true);
  const { language } = useSelector((state: IRootState) => state.settings);
  const [products, setProducts] = useState<Product[]>([]);

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

  if (!loading && products.length === 0) return null;

  const visibleProducts = products.slice(0, 8);
  const skeletonItems = Array.from({ length: 4 });

  return (
    <section className="bg-white py-12">
      <Container>
        <SectionHeader
          title={t(language, "featuredProductsTitle")}
          subtitle={t(language, "featuredSubtitle")}
          badge={t(language, "sectionFeatured")}
          badgeIcon={<Sparkles className="h-4 w-4" />}
          viewAllLabel={t(language, "sectionViewAll")}
          viewAllHref="/products"
          className="mb-6"
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {loading
            ? skeletonItems.map((_, index) => (
                <div key={`featured-skeleton-${index}`} className="h-full">
                  <ProductCard loading item={null} />
                </div>
              ))
            : visibleProducts.map((item: Product, index: number) => (
                <div key={item._id || item.slug || index} className="h-full">
                  <ProductCard loading={false} item={item} />
                </div>
              ))}
        </div>
      </Container>
    </section>
  );
}
