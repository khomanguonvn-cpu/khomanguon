"use client";

import { cn } from "@/lib/utils";
import { Option, Product, Style } from "@/types";
import React, { useEffect, useState } from "react";
import AdditionnalDescription from "./AdditionnalDescription";
import Loading from "../../custom/Loading";
import ProductInfo from "./ProductInfo";
import ProductPrice from "./ProductPrice";
import ProductQty from "./ProductQty";
import ProductStyleOptions from "./ProductStyleOptions";

export default function ProductContent({
  className,
  product,
  setImages,
  setActive,
  active,
}: {
  className: string;
  product: Product;
  active: number;
  setImages: (value: string[]) => void;
  setActive: (value: number) => void;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const subProducts = product?.subProducts || [];
  const currentSubProduct = subProducts[active] || subProducts[0];
  const options = currentSubProduct?.options || [];
  const [style, setStyle] = useState<Style | undefined>(currentSubProduct?.style);
  const [option, setOption] = useState<Option | undefined>(options[0]);
  const [optionActive, setOptionActive] = useState(0);

  const styles = subProducts
    .map((item) => item.style)
    .filter(Boolean) as Style[];

  useEffect(() => {
    const nextSubProduct = product?.subProducts?.[active] || product?.subProducts?.[0];
    const nextOption = nextSubProduct?.options?.[0];

    if (!nextSubProduct) return;

    setStyle(nextSubProduct.style);
    setOption(nextOption);
    setOptionActive(0);
    setImages(nextOption?.images?.length ? nextOption.images : []);
  }, [active, product, setImages]);

  const getStock = () => {
    return Math.max(0, Number(option?.qty || 0) - Number(option?.sold || 0));
  };

  return (
    <div className={cn("relative", className)}>
      {loading && <Loading isLoading={loading} />}

      <div className="flex flex-col gap-6">
        <ProductInfo product={product} />

        <div className="h-px bg-slate-100" />

        <ProductPrice option={option} />

        <div className="h-px bg-slate-100" />

        <ProductStyleOptions
          style={style}
          styles={styles}
          setStyle={setStyle}
          setActive={setActive}
          setOption={setOption}
          setOptionActive={setOptionActive}
          setImages={setImages}
          getStock={getStock}
          option={option}
          options={options}
        />

        <div className="h-px bg-slate-100" />

        {option ? (
          <ProductQty
            setLoading={setLoading}
            active={active}
            optionActive={optionActive}
            product={product}
          />
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            Sản phẩm này chưa có biến thể khả dụng. Vui lòng liên hệ người bán để được hỗ trợ.
          </div>
        )}

        <AdditionnalDescription product={product} active={active} />
      </div>
    </div>
  );
}
