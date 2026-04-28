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
  style: Style;
  styles: Style[];
  setStyle: (value: Style) => void;
  setActive: (value: number) => void;
  setOption: (value: Option) => void;
  setOptionActive: (value: number) => void;
  setImages: (value: string[]) => void;
  getStock: () => void;
  option: Option;
  options: Option[];
}) {
  const stockLeft = option.qty ?? 0;
  const isLowStock = stockLeft > 0 && stockLeft <= 5;
  const isOutOfStock = stockLeft === 0;

  return (
    <m.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
    >
      {/* Styles / Phong cách */}
      {styles.length > 1 && (
        <m.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-500 to-indigo-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Phong cách
            </h2>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {styles.map((item: Style, idx: number) => (
              <m.button
                onMouseEnter={() => {
                  setStyle(item);
                  setActive(idx);
                  setOption(item.options[0]);
                  setImages(item.options[0]?.images || []);
                  setOptionActive(0);
                  getStock();
                }}
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + idx * 0.05 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "relative flex-shrink-0 min-w-[100px] h-[80px] border-2 cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 flex flex-col items-center justify-center gap-2 p-3 shadow-sm",
                  item === style
                    ? "border-primary-500 bg-gradient-to-br from-primary-50 to-indigo-50 shadow-md ring-2 ring-primary-500/20"
                    : "border-slate-200 hover:border-primary-300 hover:bg-slate-50 bg-white"
                )}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    className="w-10 h-10 rounded-xl object-cover shadow-sm"
                    width={40}
                    height={40}
                    alt={item.name}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-sm">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: item.color || "#6366f1" }} />
                  </div>
                )}
                <span className={cn(
                  "text-[11px] font-bold text-center leading-tight",
                  item === style ? "text-primary-700" : "text-slate-600"
                )}>
                  {item.name}
                </span>
                {item === style && (
                  <m.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shadow-lg"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </m.div>
                )}
              </m.button>
            ))}
          </div>
        </m.div>
      )}

      {/* Options / Tùy chọn */}
      <m.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-500 to-indigo-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Tùy chọn
            </h2>
          </div>
          {/* Stock Status Badge */}
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-red-700 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Hết hàng
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Còn {stockLeft} sản phẩm
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Còn hàng
            </span>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {options.map((item: Option, idx2: number) => {
            const itemStock = item.qty ?? 0;
            const isItemOut = itemStock === 0;
            const isSelected = item === option;
            return (
              <m.button
                key={idx2}
                onMouseEnter={() => {
                  setOption(item);
                  setImages(item.images || []);
                  setOptionActive(idx2);
                  getStock();
                }}
                disabled={isItemOut}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + idx2 * 0.04, type: "spring", stiffness: 300 }}
                whileHover={!isItemOut ? { y: -1, scale: 1.02 } : {}}
                whileTap={!isItemOut ? { scale: 0.97 } : {}}
                className={cn(
                  "relative px-5 py-3 border-2 cursor-pointer rounded-xl transition-all duration-200 text-sm font-bold",
                  isItemOut
                    ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed line-through opacity-60"
                    : isSelected
                    ? "border-primary-500 bg-gradient-to-br from-primary-50 to-indigo-50 text-primary-700 shadow-md ring-2 ring-primary-500/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-slate-50 shadow-sm"
                )}
              >
                <div className="flex items-center gap-2">
                  <Package className={cn("h-3.5 w-3.5", isSelected ? "text-primary-500" : "text-slate-400")} />
                  <span>{item.option}</span>
                </div>
                {isSelected && (
                  <m.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shadow-lg"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </m.div>
                )}
              </m.button>
            );
          })}
        </div>
      </m.div>
    </m.div>
  );
}
