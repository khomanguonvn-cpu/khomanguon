"use client";
import React, { useState } from "react";
import Container from "../../custom/Container";
import ProductImage from "./ProductImage";
import ProductContent from "./ProductContent";
import { Product } from "@/types";
import { m } from "framer-motion";

export default function ProductWrapper({ product }: { product: Product }) {
  const [active, setActive] = useState<number>(0);
  const [images, setImages] = useState<string[]>(
    product?.subProducts?.[active]?.options?.[0]?.images?.length
      ? product.subProducts[active].options[0].images
      : product?.subProducts?.[active]?.style?.image
        ? [product.subProducts[active].style.image]
        : ["/assets/images/placeholders/placeholder.png"]
  );

  return (
    <section className="bg-white py-6 lg:py-10">
      <Container>
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:gap-12"
        >
          <div className="w-full lg:sticky lg:top-6 lg:self-start">
            <ProductImage
              className="w-full"
              product={product}
              images={images}
              active={active}
            />
          </div>

          <div className="w-full">
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <ProductContent
                className="w-full"
                product={product}
                active={active}
                setImages={setImages}
                setActive={setActive}
              />
            </m.div>
          </div>
        </m.div>
      </Container>
    </section>
  );
}
