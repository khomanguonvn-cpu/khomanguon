"use client";
import React from "react";
import Heading from "../../custom/Heading";
import CategoriesAccordion from "../../custom/CategoriesAccordion";
import FiltersPrice from "../../custom/FiltersPrice";
import LatestProducts from "./LatestProducts";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function SidebarLeft({
  minPrice,
  maxPrice,
  loading,
  setMinPrice,
  setMaxPrice,
}: {
  minPrice: number;
  maxPrice: number;
  loading: boolean;
  setMinPrice: (value: number) => void;
  setMaxPrice: (value: number) => void;
}) {
  const { language } = useSelector((state: IRootState) => state.settings);

  return (
    <div className="max-w-[260px] 2xl:max-w-[280px] w-full flex-col gap-8 h-full hidden xl:flex">
      {/* categories */}
      <div className="flex flex-col w-full relative">
        <Heading name={t(language, "productCategoriesTitle")} />
        <div className="flex my-4">
          <CategoriesAccordion className="w-full" />
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-col w-full relative">
        <Heading name={t(language, "filtersSidebarTitle")} />
        <div className="flex my-4">
          <FiltersPrice
            loading={loading}
            minPrice={minPrice}
            maxPrice={maxPrice}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
          />
        </div>
      </div>

      {/* Latest products */}
      <div className="flex flex-col w-full relative">
        <Heading name={t(language, "latestProductsTitle")} />
        <div className="flex-flex-col my-4">
          <LatestProducts />
        </div>
      </div>
    </div>
  );
}
