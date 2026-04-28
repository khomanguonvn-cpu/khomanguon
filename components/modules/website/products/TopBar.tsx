"use client";
import React from "react";
import FiltersMobile from "./FiltersMobile";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export default function TopBar({
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  loading,
  slug,
  perpage,
  filter,
  setPerPages,
  setFilter,
}: {
  minPrice: number;
  maxPrice: number;
  setMinPrice: (value: number) => void;
  setMaxPrice: (value: number) => void;
  loading: boolean;
  slug?: string;
  perpage: number;
  filter: string;
  setPerPages: (value: number) => void;
  setFilter: (value: string) => void;
}) {
  const { language } = useSelector((state: IRootState) => state.settings);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 flex-1 justify-between">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-between w-full">
        <FiltersMobile
          minPrice={minPrice}
          maxPrice={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          loading={loading}
        />

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="h-11 min-w-[124px] text-sm sm:text-base font-semibold"
              >
                {filter ? filter : slug}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56">
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value="bottom">
                <DropdownMenuRadioItem value="top" onClick={() => setFilter("alphabetic")}>
                  {t(language, "sortAlphabetical")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value={filter} onClick={() => setFilter("priceLowToHigh")}>
                  {t(language, "sortPriceLowToHigh")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value={filter} onClick={() => setFilter("priceHighToLow")}>
                  {t(language, "sortPriceHighToLow")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value={filter} onClick={() => setFilter("latest")}>
                  {t(language, "sortNewest")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="hidden sm:inline text-sm sm:text-base text-slate-500 whitespace-nowrap">
            {t(language, "displayLabel")}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="h-11 min-w-[72px] text-sm sm:text-base font-semibold"
              >
                {perpage}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56">
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value="bottom">
                <DropdownMenuRadioItem value="30" onClick={() => setPerPages(30)}>30</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="20" onClick={() => setPerPages(20)}>20</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="10" onClick={() => setPerPages(10)}>10</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="5" onClick={() => setPerPages(5)}>5</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
