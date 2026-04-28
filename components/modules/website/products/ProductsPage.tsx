"use client";
import Container from "@/components/modules/custom/Container";
import MainProduct from "@/components/modules/website/products/MainProduct";
import SidebarLeft from "@/components/modules/website/products/SidebarLeft";
import React, { useState } from "react";

export default function ProductsPage() {
  const [loading, setLoading] = useState(false);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(Number.MAX_SAFE_INTEGER);

  return (
    <section className="my-6 h-full w-full">
      <Container>
        <div className="flex h-full flex-col xl:flex-row gap-6 xl:gap-10 w-full">
          <SidebarLeft
            minPrice={minPrice}
            maxPrice={maxPrice}
            loading={loading}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
          />
          <MainProduct
            minPrice={minPrice}
            maxPrice={maxPrice}
            loading={loading}
            setLoading={setLoading}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
          />
        </div>
      </Container>
    </section>
  );
}
