"use client";
import React, { useEffect, useState } from "react";
import Container from "../../custom/Container";
import SectionHeader from "../../custom/SectionHeader";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { cn } from "@/lib/utils";
import "./style.css";
import "swiper/css";
import { Category } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function BrandList() {
  const [loading, setLoading] = useState(false);
  const { language } = useSelector((state: IRootState) => state.settings);
  const [brands, setBrands] = useState<Category[]>([]);

  useEffect(() => {
    const getProducts = () => {
      setLoading(true);
      axios
        .get("/api/categories")
        .then((response) => {
          const categoryAsBrands: Category[] = (response.data.data || []).map(
            (item: Category) => ({
              ...item,
              image: item.image || `/assets/images/placeholders/${item.slug || "placeholder"}.png`,
            })
          );
          setBrands(categoryAsBrands);
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
    <section className="py-12 border-t border-slate-200">
      <Container>
        <SectionHeader
          title={t(language, "sectionPartnersBrands")}
          badge={t(language, "sectionPartners")}
          badgeIcon={
            <Image
              src="/assets/images/partners-badge.svg"
              alt="Đối tác"
              width={16}
              height={16}
              className="h-4 w-4 object-contain"
            />
          }
        />

        <Swiper
          breakpoints={{
            360: { slidesPerView: 2, spaceBetween: 16 },
            575: { slidesPerView: 3, spaceBetween: 24 },
            768: { slidesPerView: 4, spaceBetween: 32 },
            1024: { slidesPerView: 5, spaceBetween: 40 },
            1280: { slidesPerView: 6, spaceBetween: 48 },
          }}
          autoplay={{
            delay: 20000,
            disableOnInteraction: false,
          }}
          spaceBetween={32}
          slidesPerView={2}
          navigation={false}
          pagination={false}
          modules={[Autoplay]}
          className={cn("mySwiper")}
        >
          {brands.slice(0, 12).map((item: Category, idx: number) => (
            <SwiperSlide key={idx} className="py-4">
              <Link
                href={`/categories/${item.link}/products`}
                className="flex items-center justify-center h-24 px-8 rounded-xl border border-slate-200 bg-white hover:border-primary-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <Image
                  className="object-contain max-h-16 w-auto grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  src={item.image || "/assets/images/logo.svg"}
                  width={100}
                  height={64}
                  alt={item.name}
                  unoptimized
                />
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </section>
  );
}
