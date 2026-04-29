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
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

type PartnerBrandLogo = {
  id: number;
  name: string;
  logoUrl: string;
  link: string;
  sortOrder: number;
};

function PartnerLogoCard({ item }: { item: PartnerBrandLogo }) {
  const content = (
    <Image
      className="object-contain max-h-16 w-auto grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
      src={item.logoUrl}
      width={120}
      height={72}
      alt={item.name}
      unoptimized
    />
  );

  const className =
    "flex items-center justify-center h-24 px-8 rounded-xl border border-slate-200 bg-white hover:border-primary-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300";

  if (!item.link) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={item.link} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </Link>
  );
}

export default function BrandList() {
  const [loading, setLoading] = useState(true);
  const { language } = useSelector((state: IRootState) => state.settings);
  const [brands, setBrands] = useState<PartnerBrandLogo[]>([]);

  useEffect(() => {
    let mounted = true;

    axios
      .get("/api/partners")
      .then((response) => {
        if (!mounted) return;
        const data = Array.isArray(response.data?.data) ? response.data.data : [];
        setBrands(
          data
            .map((item: Partial<PartnerBrandLogo>) => ({
              id: Number(item.id || 0),
              name: String(item.name || "").trim(),
              logoUrl: String(item.logoUrl || "").trim(),
              link: String(item.link || "").trim(),
              sortOrder: Number(item.sortOrder || 0),
            }))
            .filter((item: PartnerBrandLogo) => item.id > 0 && item.name && item.logoUrl)
        );
      })
      .catch(() => {
        if (mounted) {
          setBrands([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!loading && brands.length === 0) {
    return null;
  }

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
          {(loading ? Array.from({ length: 6 }) : brands.slice(0, 24)).map((item, idx) => (
            <SwiperSlide key={loading ? idx : (item as PartnerBrandLogo).id} className="py-4">
              {loading ? (
                <div className="h-24 rounded-xl border border-slate-200 bg-white animate-pulse" />
              ) : (
                <PartnerLogoCard item={item as PartnerBrandLogo} />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </section>
  );
}
