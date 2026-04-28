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
    product?.subProducts[active]?.options[0]?.images?.length
      ? product.subProducts[active].options[0].images
      : ["/assets/images/placeholders/placeholder.png"]
  );

  return (
    <section className="my-6 lg:my-10">
      <Container>
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-start"
        >
          <div className="w-full lg:w-1/2 lg:sticky lg:top-6">
            <ProductImage
              className="w-full"
              product={product}
              images={images}
              active={active}
            />
          </div>

          <div className="w-full lg:w-1/2">
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
