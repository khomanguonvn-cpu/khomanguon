"use client";
import React, { useEffect, useState } from "react";
import Container from "../../custom/Container";
import SectionHeader from "../../custom/SectionHeader";
import { Category } from "@/types";
import axios from "axios";
import Link from "next/link";
import Loading from "../../custom/Loading";
import Image from "next/image";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { ArrowRight, Flame } from "lucide-react";

export default function TopCategories() {
  const [loading, setLoading] = useState(false);
  const { language } = useSelector((state: IRootState) => state.settings);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const getCategories = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/categories");
        setCategories(response.data.data || []);
      } catch {
        // Lỗi tải dữ liệu
      } finally {
        setLoading(false);
      }
    };
    getCategories();
  }, []);

  const topCats = categories.slice(0, 6);

  return (
    <section className="py-12 w-full">
      <Container>
        {loading && <Loading isLoading={loading} />}

        {/* Section Header */}
        <SectionHeader
          title={t(language, "topCategoriesTitle")}
          subtitle={t(language, "topCatsSubtitle")}
          badge={t(language, "sectionHot")}
          badgeIcon={<Flame className="h-4 w-4" />}
          viewAllLabel={t(language, "sectionViewAll")}
          viewAllHref="/products"
        />

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {topCats.map((item, idx) => (
            <Link
              key={idx}
              href={`/categories/${item.link}/products`}
              className="group flex flex-col items-center gap-4 p-6 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {/* Icon/Image */}
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 group-hover:scale-110 transition-all duration-300">
                <Image
                  src={item.image || "/assets/images/logo.svg"}
                  alt={item.name}
                  width={36}
                  height={36}
                  className="object-contain"
                  unoptimized
                />
              </div>

              {/* Name */}
              <h3 className="capitalize text-sm font-semibold text-slate-700 group-hover:text-primary-600 text-center transition-colors leading-snug line-clamp-2">
                {item.name}
              </h3>

              {/* Arrow hint */}
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" />
            </Link>
          ))}
        </div>

        {/* View All Categories */}
        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-300 text-slate-600 font-medium hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
          >
            {t(language, "browseAllCategories")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
