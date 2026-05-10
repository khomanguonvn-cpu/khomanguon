
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
import { getGlobalSeoSafe } from "@/lib/seo-config";
import {
  SEO_DEFAULT_BASE_URL,
  SEO_DEFAULT_FAVICON_PATH,
  SEO_DEFAULT_OG_IMAGE_PATH,
  SEO_SITE_NAME,
  getSeoBaseUrl,
} from "@/lib/seo-constants";

export const dynamic = "force-dynamic";

export default async function page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const baseUrl = getSeoBaseUrl();
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const subCategories = Array.isArray(product.subCategories) ? product.subCategories : [];
  const firstOption = product.subProducts?.[0]?.options?.[0];
  const productImages = firstOption?.images || [];
  const price = firstOption?.price || 0;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} - Sản phẩm chất lượng trên ${SEO_SITE_NAME}`,
    image: productImages.map((img: string) => `${baseUrl}${img}`),
    sku: product.subProducts?.[0]?.sku || product.slug,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || SEO_SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/products/${slug}`,
      priceCurrency: "VND",
      price: price,
      availability: price > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SEO_SITE_NAME,
        url: baseUrl,
      },
    },
    aggregateRating: reviews.length
      ? {
          "@type": "AggregateRating",
          ratingValue: (
            reviews.reduce((sum: number, r: { rating: number }) => sum + Number(r.rating || 0), 0) /
            reviews.length
          ).toFixed(1),
          reviewCount: reviews.length,
        }
      : undefined,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: baseUrl },
      { "@type": "ListItem", position: 2, name: product.category.name, item: `${baseUrl}/categories/${product.category.slug}/products` },
      ...subCategories.map((item: SubCategory, idx: number) => ({
        "@type": "ListItem" as const,
        position: 3 + idx,
        name: item.name,
        item: `${baseUrl}/categories/${item.slug}/products`,
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

              {subCategories.map((item: SubCategory, idx: number) => (
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch product + admin SEO config song song
  const [product, seo] = await Promise.all([
    getProductBySlug(slug),
    getGlobalSeoSafe(),
  ]);

  const baseUrl = getSeoBaseUrl();
  const favicon = seo?.favicon || SEO_DEFAULT_FAVICON_PATH;
  const siteName = SEO_SITE_NAME;

  if (!product) {
    return {
      title: `Sản phẩm không tồn tại | ${siteName}`,
      description: "Không tìm thấy sản phẩm bạn đang tìm kiếm.",
      robots: { index: false, follow: false },
      icons: { icon: favicon },
    };
  }

  const subCategories = Array.isArray(product.subCategories) ? product.subCategories : [];
  const firstOption = product.subProducts?.[0]?.options?.[0];
  const images = firstOption?.images?.[0] || seo?.ogImage || SEO_DEFAULT_OG_IMAGE_PATH;
  const price = firstOption?.price || 0;

  const title = `${product.name} | Mua ngay tại ${siteName}`;
  const description =
    product.description?.substring(0, 160) ||
    `${product.name} - Sản phẩm chất lượng cao, giao hàng nhanh chóng trên ${siteName}. Mua ngay hôm nay!`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.category.name,
      ...subCategories.map((s: SubCategory) => s.name),
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
      url: `${baseUrl}/products/${slug}`,
      images: [
        {
          url: images,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      type: "article",
      siteName,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [images],
      ...(seo?.twitterHandle ? { creator: seo.twitterHandle } : {}),
    },
    other: {
      "product:price:amount": String(price),
      "product:price:currency": "VND",
    },
    icons: { icon: favicon },
  } as Metadata;
}
