import { cn } from "@/lib/utils";
import { Option, Style } from "@/types";
import Image from "next/image";
import React from "react";
import { Check, Package } from "lucide-react";
import { m } from "framer-motion";

export default function ProductStyleOptions({
  style,
  styles,
  setStyle,
  setActive,
  setOption,
  setOptionActive,
  setImages,
  getStock,
  option,
  options,
}: {
  style?: Style;
  styles: Style[];
  setStyle: (value: Style | undefined) => void;
  setActive: (value: number) => void;
  setOption: (value: Option | undefined) => void;
  setOptionActive: (value: number) => void;
  setImages: (value: string[]) => void;
  getStock: () => number;
  option?: Option;
  options: Option[];
}) {
  const stockLeft = Math.max(0, Number(option?.qty || 0));
  const isLowStock = stockLeft > 0 && stockLeft <= 5;
  const isOutOfStock = stockLeft === 0;

  const selectStyle = (item: Style, index: number) => {
    const firstOption = item.options?.[0];

    setStyle(item);
    setActive(index);
    setOption(firstOption);
    setImages(firstOption?.images || []);
    setOptionActive(0);
    getStock();
  };

  const selectOption = (item: Option, index: number) => {
    setOption(item);
    setImages(item.images || []);
    setOptionActive(index);
    getStock();
  };

  return (
    <m.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
    >
      {styles.length > 1 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-primary-600" />
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
              Phong cách
            </h2>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {styles.map((item: Style, index: number) => {
              const isSelected = item === style;

              return (
                <m.button
                  type="button"
                  onClick={() => selectStyle(item, index)}
                  key={`${item.name}-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.04 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "relative flex h-20 min-w-[112px] flex-shrink-0 items-center gap-3 rounded-lg border p-3 text-left shadow-sm transition-all duration-200",
                    isSelected
                      ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/15"
                      : "border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50"
                  )}
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      className="h-11 w-11 rounded-md object-cover shadow-sm"
                      width={44}
                      height={44}
                      alt={item.name}
                    />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100">
                      <span
                        className="h-5 w-5 rounded-full"
                        style={{ backgroundColor: item.color || "#6366f1" }}
                      />
                    </span>
                  )}
                  <span
                    className={cn(
                      "line-clamp-2 text-xs font-bold leading-snug",
                      isSelected ? "text-primary-700" : "text-slate-700"
                    )}
                  >
                    {item.name}
                  </span>
                  {isSelected && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </m.button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-primary-600" />
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
              Chọn gói
            </h2>
          </div>

          {option && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
                isOutOfStock
                  ? "border-red-200 bg-red-50 text-red-700"
                  : isLowStock
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isOutOfStock
                    ? "bg-red-500"
                    : isLowStock
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                )}
              />
              {isOutOfStock
                ? "Hết hàng"
                : isLowStock
                ? `Còn ${stockLeft} sản phẩm`
                : "Còn hàng"}
            </span>
          )}
        </div>

        {options.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {options.map((item: Option, index: number) => {
              const itemStock = Math.max(0, Number(item.qty || 0));
              const isItemOut = itemStock === 0;
              const isSelected = item === option;

              return (
                <m.button
                  type="button"
                  key={`${item.option}-${index}`}
                  onClick={() => selectOption(item, index)}
                  disabled={isItemOut}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.22 + index * 0.04 }}
                  whileHover={!isItemOut ? { y: -1 } : {}}
                  whileTap={!isItemOut ? { scale: 0.98 } : {}}
                  className={cn(
                    "relative flex min-h-[56px] items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left shadow-sm transition-all duration-200",
                    isItemOut
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-70"
                      : isSelected
                      ? "border-primary-500 bg-primary-50 text-primary-800 ring-2 ring-primary-500/15"
                      : "border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-slate-50"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Package
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isSelected ? "text-primary-600" : "text-slate-400"
                      )}
                    />
                    <span className={cn("line-clamp-2 text-sm font-bold", isItemOut && "line-through")}>
                      {item.option}
                    </span>
                  </span>

                  <span className="shrink-0 text-xs font-semibold text-slate-400">
                    {isItemOut ? "Hết" : `${itemStock} còn`}
                  </span>

                  {isSelected && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </m.button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            Chưa có gói khả dụng.
          </div>
        )}
      </div>
    </m.div>
  );
}
