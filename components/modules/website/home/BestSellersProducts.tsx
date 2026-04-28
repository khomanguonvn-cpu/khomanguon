"use client";
import React, { useEffect, useState } from "react";
import Container from "../../custom/Container";
import SectionHeader from "../../custom/SectionHeader";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import "./style.css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css";
import { Product } from "@/types";
import ProductCard from "../../custom/ProductCard";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function BestSellersProducts() {
  const [loading, setLoading] = useState(false);
  const { language } = useSelector((state: IRootState) => state.settings);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const getProducts = () => {
      setLoading(true);
      axios
        .get("/api/products", { params: { bestsellers: "yes" } })
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
    <section className="py-12 bg-slate-50">
      <Container>
        <SectionHeader
          title={t(language, "sectionBestSellers")}
          subtitle={t(language, "bestSellersSubtitle")}
          badge={t(language, "sectionTop")}
          badgeIcon={<Trophy className="h-4 w-4" />}
          viewAllLabel={t(language, "sectionViewAll")}
          viewAllHref="/products?sort=bestsellers"
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
            delay: 35000,
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
