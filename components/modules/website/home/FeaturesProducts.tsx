"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Sparkles } from "lucide-react";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import { IRootState } from "@/store";
import { Product } from "@/types";
import { t } from "@/lib/i18n";
import Container from "../../custom/Container";
import ProductCard from "../../custom/ProductCard";
import SectionHeader from "../../custom/SectionHeader";
import "./style.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

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

  const visibleProducts = products.slice(0, 10);
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

        <Swiper
          breakpoints={{
            360: { slidesPerView: 1.15, spaceBetween: 14 },
            575: { slidesPerView: 2, spaceBetween: 16 },
            768: { slidesPerView: 2.4, spaceBetween: 18 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
            1280: { slidesPerView: 4, spaceBetween: 22 },
          }}
          autoplay={{
            delay: 22000,
            disableOnInteraction: false,
          }}
          spaceBetween={18}
          slidesPerView={1.15}
          navigation={false}
          pagination={{
            clickable: true,
            bulletActiveClass: "swiper-pagination-bullet-active !bg-primary-600",
          }}
          modules={[Autoplay, Pagination]}
          className={cn("mySwiper !overflow-visible pb-10")}
        >
          {loading
            ? skeletonItems.map((_, index) => (
                <SwiperSlide key={`featured-skeleton-${index}`} className="!h-auto pb-8">
                  <ProductCard loading item={null} />
                </SwiperSlide>
              ))
            : visibleProducts.map((item: Product, index: number) => (
                <SwiperSlide key={item._id || item.slug || index} className="!h-auto pb-8">
                  <ProductCard loading={false} item={item} />
                </SwiperSlide>
              ))}
        </Swiper>
      </Container>
    </section>
  );
}
