export const runtime = 'edge';

import Container from "@/components/modules/custom/Container";
import FeaturesProducts from "@/components/modules/website/home/FeaturesProducts";
import ProductSpecifications from "@/components/modules/website/product/ProductSpecifications";
import ProductWrapper from "@/components/modules/website/product/ProductWrapper";
import Reviews from "@/components/modules/website/product/Reviews";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getProductBySlug } from "@/actions/product";
import { SubCategory } from "@/types";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React, { Fragment } from "react";
import Script from "next/script";

const BASE_URL = "https://khomanguon.io.vn";

export default async function page({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const firstOption = product.subProducts[0]?.options[0];
  const productImages = firstOption?.images || [];
  const primaryImage = productImages[0] || "/assets/images/logo.svg";
  const price = firstOption?.price || 0;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} - Sản phẩm chất lượng trên KHOMANGUON.IO.VN`,
    image: productImages.map((img: string) => `${BASE_URL}${img}`),
    sku: product.subProducts[0]?.sku || product.slug,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || "KHOMANGUON",
    },
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/products/${params.slug}`,
      priceCurrency: "VND",
      price: price,
      availability: price > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "KHOMANGUON.IO.VN",
        url: BASE_URL,
      },
    },
    aggregateRating: product.reviews?.length
      ? {
          "@type": "AggregateRating",
          ratingValue: (
            product.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
            product.reviews.length
          ).toFixed(1),
          reviewCount: product.reviews.length,
        }
      : undefined,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: product.category.name, item: `${BASE_URL}/categories/${product.category.slug}/products` },
      ...product.subCategories.map((item: SubCategory, idx: number) => ({
        "@type": "ListItem" as const,
        position: 3 + idx,
        name: item.name,
        item: `${BASE_URL}/categories/${item.slug}/products`,
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="my-10">
        <Container>
          <Breadcrumb>
            <BreadcrumbList className="capitalize flex flex-wrap">
              <Link href={"/products"}>cửa hàng</Link>
              <BreadcrumbSeparator />

              <Link href={`/categories/${product.category.slug}/products`}>
                {product.category.name}
              </Link>

              <BreadcrumbSeparator />

              {product.subCategories.map((item: SubCategory, idx: number) => (
                <Fragment key={idx}>
                  <ul>
                    <li>
                      <Link href={`/categories/${item.slug}/products`}>
                        {item.name}
                      </Link>
                    </li>
                  </ul>
                  <BreadcrumbSeparator />
                </Fragment>
              ))}

              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                  {product.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Container>
      </section>

      <ProductWrapper product={product} />
      <ProductSpecifications product={product} />
      <FeaturesProducts />
      <Reviews product={product} />
    </>
  );
}

// dynamic seo
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: "Sản phẩm không tồn tại | KHOMANGUON.IO.VN",
      description: "Không tìm thấy sản phẩm bạn đang tìm kiếm.",
      robots: { index: false, follow: false },
      icons: { icon: "/assets/images/logo.svg" },
    };
  }

  const firstOption = product.subProducts[0]?.options[0];
  const images = firstOption?.images[0] || "/assets/images/logo.svg";
  const price = firstOption?.price || 0;
  const slug = params.slug;

  const title = `${product.name} | Mua ngay tại KHOMANGUON.IO.VN`;
  const description =
    product.description?.substring(0, 160) ||
    `${product.name} - Sản phẩm chất lượng cao, giao hàng nhanh chóng trên KHOMANGUON.IO.VN. Mua ngay hôm nay!`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.category.name,
      ...product.subCategories.map((s: SubCategory) => s.name),
      "mua " + product.name.toLowerCase(),
      "KHOMANGUON",
      product.brand?.name,
    ].filter(Boolean),
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://khomanguon.io.vn/products/${slug}`,
      images: [
        {
          url: images,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      type: "article",
      siteName: "KHOMANGUON.IO.VN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [images],
    },
    other: {
      "product:price:amount": String(price),
      "product:price:currency": "VND",
    },
    icons: { icon: "/assets/images/logo.svg" },
  } as Metadata;
}
