"use client";
import React, { useEffect, useState } from "react";
import Container from "../../custom/Container";
import SectionHeader from "../../custom/SectionHeader";
import axios from "axios";
import { Product } from "@/types";
import ProductCard from "../../custom/ProductCard";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(false);
  const { language } = useSelector((state: IRootState) => state.settings);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const getProducts = () => {
      setLoading(true);
      axios
        .get(`/api/products?category=${categorySlug}`)
        .then((response) => {
          setProducts(response.data.data || []);
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    };
    getProducts();
  }, [categorySlug]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-8">
      <Container>
        <SectionHeader
          title={title}
          badge={title}
          badgeIcon={icon || <Package className="h-4 w-4" />}
          viewAllLabel="Xem tất cả"
          viewAllHref={`/categories/${categorySlug}/products`}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 mt-6">
          {loading
            ? Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="pb-4">
                  <ProductCard loading={true} item={null as any} />
                </div>
              ))
            : products.slice(0, 10).map((item: Product, idx: number) => (
                <div key={idx} className="pb-4">
                  <ProductCard loading={false} item={item} />
                </div>
              ))}
        </div>
      </Container>
    </section>
  );
}
