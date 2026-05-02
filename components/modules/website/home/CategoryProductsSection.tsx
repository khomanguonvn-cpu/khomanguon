"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Package } from "lucide-react";
import { Product } from "@/types";
import Container from "../../custom/Container";
import ProductCard from "../../custom/ProductCard";
import SectionHeader from "../../custom/SectionHeader";

interface CategoryProductsSectionProps {
  title: string;
  categorySlug: string;
  icon?: React.ReactNode;
}

export default function CategoryProductsSection({
  title,
  categorySlug,
  icon,
}: CategoryProductsSectionProps) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const getProducts = () => {
      setLoading(true);
      axios
        .get(`/api/products?category=${categorySlug}`)
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
  }, [categorySlug]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-10">
      <Container>
        <SectionHeader
          title={title}
          badge={title}
          badgeIcon={icon || <Package className="h-4 w-4" />}
          viewAllLabel="Xem tất cả"
          viewAllHref={`/categories/${categorySlug}/products`}
          className="mb-6"
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div key={`category-product-skeleton-${index}`} className="h-full">
                  <ProductCard loading item={null} />
                </div>
              ))
            : products.slice(0, 10).map((item: Product, index: number) => (
                <div key={item._id || item.slug || index} className="h-full">
                  <ProductCard loading={false} item={item} />
                </div>
              ))}
        </div>
      </Container>
    </section>
  );
}
