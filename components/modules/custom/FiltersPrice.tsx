"use client";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";

export default function FiltersPrice({
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
  const [minPricePreview, setMinPricePreview] = useState(minPrice);
  const [maxPricePreview, setMaxPricePreview] = useState(
    Number.isFinite(maxPrice) && maxPrice < Number.MAX_SAFE_INTEGER ? maxPrice : 10000000
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <h1 className="text-sm font-bold">{t(language, "filtersPriceTitle")}</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-1 my-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="minPrice">{t(language, "filtersPriceMin")}</label>
            <input
              defaultValue={0}
              type="range"
              name="minPrice"
              id="minPrice"
              disabled={loading}
              min={0}
              max={10000000}
              step={1000}
              onMouseUp={(e: React.MouseEvent<HTMLInputElement>) =>
                setMinPrice(parseInt(e.currentTarget.value))
              }
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMinPricePreview(parseInt(e.currentTarget.value))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
            />
          </div>

          <div>
            <label htmlFor="maxPrice">{t(language, "filtersPriceMax")}</label>
            <input
              defaultValue={10000000}
              type="range"
              name="maxPrice"
              id="maxPrice"
              disabled={loading}
              max={10000000}
              step={1000}
              onMouseUp={(e: React.MouseEvent<HTMLInputElement>) =>
                setMaxPrice(parseInt(e.currentTarget.value))
              }
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMaxPricePreview(parseInt(e.currentTarget.value))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
            />
          </div>

          <div className="col-span-2 flex items-center justify-between space-x-2">
            <input
              type="number"
              name="numprice"
              id="min-price-input"
              value={minPricePreview}
              readOnly
              className="bock w-full rounde-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900  focus:border-primary-500 focus:ring-primary-500"
            />

            <div className="flex text-sm font-medium">—</div>

            <input
              type="number"
              name="numprice"
              id="max-price-input"
              value={maxPricePreview}
              readOnly
              className="bock w-full rounde-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900  focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
