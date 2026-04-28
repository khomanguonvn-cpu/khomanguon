"use client";
import React, { useEffect, useState } from "react";
import Container from "../../custom/Container";
import SectionHeader from "../../custom/SectionHeader";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import "./style.css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css";
import { Product } from "@/types";
import ProductCard from "../../custom/ProductCard";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function FeaturesProducts() {
  const [loading, setLoading] = useState(false);
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
          // Lỗi tải dữ liệu
        })
        .finally(() => {
          setLoading(false);
        });
    };
    getProducts();
  }, []);

  return (
    <section className="py-12">
      <Container>
        <SectionHeader
          title={t(language, "featuredProductsTitle")}
          subtitle={t(language, "featuredSubtitle")}
          badge={t(language, "sectionFeatured")}
          badgeIcon={<Sparkles className="h-4 w-4" />}
          viewAllLabel={t(language, "sectionViewAll")}
          viewAllHref="/products"
        />

        <Swiper
          breakpoints={{
            360: { slidesPerView: 1, spaceBetween: 16 },
            575: { slidesPerView: 1, spaceBetween: 18 },
            768: { slidesPerView: 1, spaceBetween: 22 },
            900: { slidesPerView: 2, spaceBetween: 24 },
            1180: { slidesPerView: 3, spaceBetween: 28 },
            1536: { slidesPerView: 4, spaceBetween: 32 },
          }}
          autoplay={{
            delay: 25000,
            disableOnInteraction: false,
          }}
          spaceBetween={24}
          slidesPerView={1}
          navigation={false}
          pagination={{
            clickable: true,
            bulletActiveClass: "swiper-pagination-bullet-active !bg-primary-600",
          }}
          modules={[Autoplay, Pagination]}
          className={cn("mySwiper")}
        >
          {products.slice(0, 10).map((item: Product, idx: number) => (
            <SwiperSlide key={idx} className="pb-12">
              <ProductCard loading={loading} item={item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </section>
  );
}
