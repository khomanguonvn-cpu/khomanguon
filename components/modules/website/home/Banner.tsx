import React from "react";
import CategoryList from "./CategoryList";
import HomeSlide from "./HomeSlide";
import SellerHighlight from "./SellerHighlight";
import Container from "@/components/modules/custom/Container";

export default function Banner() {
  return (
    <section className="w-full py-5 lg:py-6 bg-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_240px] xl:grid-cols-[248px_minmax(0,1fr)_300px] gap-4 items-start">
          <CategoryList className="hidden lg:flex w-full border border-slate-200 bg-white overflow-visible relative z-30 min-h-[420px]" style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }} />
          <HomeSlide className="w-full overflow-hidden" style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))" }} />
          <SellerHighlight />
        </div>
      </Container>
    </section>
  );
}
