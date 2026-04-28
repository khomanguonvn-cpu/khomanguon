import React from "react";
import CategoryList from "./CategoryList";
import HomeSlide from "./HomeSlide";
import SellerHighlight from "./SellerHighlight";
import Container from "@/components/modules/custom/Container";

export default function Banner() {
  return (
    <section className="w-full py-4 lg:py-5">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_240px] xl:grid-cols-[248px_minmax(0,1fr)_300px] gap-4 items-start">
          <CategoryList className="hidden lg:flex w-full rounded-xl border border-slate-200 bg-white shadow-card overflow-visible relative z-30 min-h-[420px]" />
          <HomeSlide className="w-full rounded-xl overflow-hidden shadow-card" />
          <SellerHighlight />
        </div>
      </Container>
    </section>
  );
}
