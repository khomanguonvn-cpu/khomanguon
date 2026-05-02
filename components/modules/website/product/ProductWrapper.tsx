"use client";
import React, { useState } from "react";
import Container from "../../custom/Container";
import ProductImage from "./ProductImage";
import ProductContent from "./ProductContent";
import { Product } from "@/types";
import { m } from "framer-motion";

export default function ProductWrapper({ product }: { product: Product }) {
  const [active, setActive] = useState<number>(0);
  const extractedImages = React.useMemo(() => {
    if (product?.assets && Array.isArray(product.assets) && product.assets.length > 0) {
      const assetUrls = product.assets
        .filter((a: any) => a.type === "image" && a.url)
        .map((a: any) => a.url);
      if (assetUrls.length > 0) return assetUrls;
    }

    if (product?.subProducts?.[active]?.options?.[0]?.images?.length) {
      return product.subProducts[active].options[0].images;
    }

    if (product?.subProducts?.[active]?.style?.image) {
      return [product.subProducts[active].style.image];
    }

    return [];
  }, [product, active]);

  const [images, setImages] = useState<string[]>(
    extractedImages.length > 0 ? extractedImages : ["/assets/images/placeholders/placeholder.png"]
  );

  React.useEffect(() => {
    if (extractedImages.length > 0) {
      setImages(extractedImages);
    }
  }, [extractedImages]);

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
