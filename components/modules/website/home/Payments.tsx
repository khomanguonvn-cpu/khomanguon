"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { cn } from "@/lib/utils";
import "./style.css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css";
import Container from "../../custom/Container";
import {
  Headset,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function Payments() {
  const { language } = useSelector((state: IRootState) => state.settings);

  const items = [
    {
      icon: Headset,
      title: t(language, "payments247"),
      subtitle: t(language, "payments247Subtitle"),
    },
    {
      icon: CreditCard,
      title: t(language, "paymentsFlexible"),
      subtitle: t(language, "paymentsFlexibleSubtitle"),
    },
    {
      icon: LockKeyhole,
      title: t(language, "paymentsSecure"),
      subtitle: t(language, "paymentsSecureSubtitle"),
    },
    {
      icon: ShieldCheck,
      title: t(language, "paymentsModerated"),
      subtitle: t(language, "paymentsModeratedSubtitle"),
    },
    {
      icon: Clock3,
      title: t(language, "paymentsFast"),
      subtitle: t(language, "paymentsFastSubtitle"),
    },
  ];

  return (
    <section className="mt-4">
      <Container>
        <Swiper
          breakpoints={{
            360: {
              slidesPerView: 1,
              spaceBetween: 40,
            },
            575: {
              slidesPerView: 2,
              spaceBetween: 40,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 40,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 40,
            },
            1280: {
              slidesPerView: 5,
              spaceBetween: 40,
            },
          }}
          autoplay={{
            delay: 25000,
            disableOnInteraction: false,
          }}
          spaceBetween={50}
          slidesPerView={1}
          navigation={false}
          pagination={true}
          modules={[Autoplay, Navigation, Pagination]}
          className={cn("mySwiper shadow-xl h-full w-full")}
        >
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <SwiperSlide key={idx} className="relative py-10">
                <div className="flex items-center justify-center gap-8 lg:after:w-[2px] lg:after:h-10 after:translate-x-14 after:bg-neutral-200">
                  <Icon className="h6 w-6 text-primary-900" />
                  <div className="flex flex-col justify-center">
                    <h1 className="uppercase font-bold">{item.title}</h1>
                    <h2 className="font-normal text-sm">{item.subtitle}</h2>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </Container>
    </section>
  );
}