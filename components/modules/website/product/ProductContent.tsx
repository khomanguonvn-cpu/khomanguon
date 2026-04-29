"use client";
import { cn } from "@/lib/utils";
import { Product, SubProduct } from "@/types";
import React, { useEffect, useState } from "react";
import ProductInfo from "./ProductInfo";
import ProductPrice from "./ProductPrice";
import ProductStyleOptions from "./ProductStyleOptions";
import ProductQty from "./ProductQty";
import AdditionnalDescription from "./AdditionnalDescription";
import Loading from "../../custom/Loading";

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
  const options = product.subProducts[active].options;
  const [style, setStyle] = useState(product.subProducts[active].style);

  const styles = product.subProducts.map((item: SubProduct) => {
    return item.style;
  });

  const [option, setOption] = useState(product.subProducts[active].options[0]);

  const [optionActive, setOptionActive] = useState(0);

  useEffect(() => {
    const nextSubProduct = product.subProducts[active];
    const nextOption = nextSubProduct?.options?.[0];
    if (!nextSubProduct || !nextOption) return;

    setStyle(nextSubProduct.style);
    setOption(nextOption);
    setOptionActive(0);
    setImages(nextOption.images || []);
  }, [active, product.subProducts, setImages]);

  const getStock = () => {
    return option.qty - option.sold;
  };

  return (
    <div>
      {loading && <Loading isLoading={loading} />}
      <div className={cn("flex flex-col gap-6", className)}>
        {/* Product Info - Name, Rating, Description, Trust Badges */}
        <ProductInfo product={product} />

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Price */}
        <div>
          <ProductPrice option={option} />
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Variant Selection - Styles + Options */}
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

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Mua hàng */}
        <div>
          <ProductQty
            setLoading={setLoading}
            active={active}
            optionActive={optionActive}
            product={product}
          />
        </div>

        {/* Share & Category Tags */}
        <AdditionnalDescription product={product} active={active} />
      </div>
    </div>
  );
}

