
import Container from "@/components/modules/custom/Container";
import NewsContentRenderer from "@/components/modules/website/news/NewsContentRenderer";
import { getPublishedNewsBySlug, getRelatedPublishedNews } from "@/actions/news";
import { mergeOpenGraph } from "@/lib/mergeOpenGraph";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const BASE_URL = "https://khomanguon.io.vn";

function formatDate(input: string | null) {
  if (!input) {
    return "";
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("vi-VN");
}

function formatISODate(input: string | null) {
  if (!input) return new Date().toISOString();
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export default async function NewsDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPublishedNewsBySlug(params.slug);
  if (!post) {
    notFound();
  }

  const related = await getRelatedPublishedNews(post.id, 6);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || "",
    image: post.coverImage ? `${BASE_URL}${post.coverImage}` : `${BASE_URL}/assets/images/logo.svg`,
    datePublished: formatISODate(post.publishedAt || post.createdAt),
    dateModified: formatISODate(post.updatedAt || post.publishedAt || post.createdAt),
    author: {
      "@type": "Organization",
      name: "KHOMANGUON.IO.VN",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "KHOMANGUON.IO.VN",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/assets/images/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/tin-tuc/${post.slug}`,
    },
    ...(post.tags?.length ? { keywords: post.tags.join(", ") } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <section className="py-8 lg:py-12 bg-white">
        <Container className="max-w-4xl">
          <div className="mb-6">
            <Link href="/tin-tuc" className="text-sm text-primary-600 hover:underline">
              ← Quay lại danh sách tin tức
            </Link>
          </div>

          <article className="space-y-6">
            <header className="space-y-4">
              <p className="text-sm text-slate-500">
                Xuất bản: {formatDate(post.publishedAt || post.createdAt)}
              </p>
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-lg text-slate-600">{post.excerpt}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {(post.tags || []).map((tag) => (
                  <span
                    key={`tag-${tag}`}
                    className="inline-flex text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </header>

            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100">
              <Image
                src={post.coverImage || "/assets/images/logo.svg"}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="prose prose-slate max-w-none">
              <NewsContentRenderer content={post.content || ""} />
            </div>

            {post.sourceUrl && (
              <p className="text-sm text-slate-500">
                Nguồn tham khảo:{" "}
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline break-all"
                >
                  {post.sourceUrl}
                </a>
              </p>
            )}
          </article>

          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Bài viết liên quan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/tin-tuc/${item.slug}`}
                    className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                  >
                    <p className="text-xs text-slate-500 mb-1">
                      {formatDate(item.publishedAt || item.createdAt)}
                    </p>
                    <p className="font-semibold text-slate-900 line-clamp-2">
                      {item.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPublishedNewsBySlug(params.slug);

  if (!post) {
    return {
      title: "Bài viết không tồn tại | KHOMANGUON.IO.VN",
      description: "Không tìm thấy bài viết tin tức bạn đang tìm.",
      robots: { index: false, follow: false },
    };
  }

  const image = post.coverImage || "/assets/images/og.png";
  const publishedTime = formatISODate(post.publishedAt || post.createdAt);
  const modifiedTime = formatISODate(post.updatedAt || post.publishedAt || post.createdAt);

  return {
    title: `${post.title} | Tin tức KHOMANGUON`,
    description: post.excerpt || `${post.title} - Bài viết tin tức công nghệ trên KHOMANGUON.IO.VN`,
    keywords: post.keywords,
    alternates: {
      canonical: `/tin-tuc/${post.slug}`,
    },
    openGraph: mergeOpenGraph({
      title: post.title,
      description: post.excerpt || "Bài viết tin tức công nghệ",
      url: `/tin-tuc/${post.slug}`,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
      type: "article",
      siteName: "KHOMANGUON.IO.VN",
    }),
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "Bài viết tin tức",
      images: [image],
    },
    other: {
      "article:published_time": publishedTime,
      "article:modified_time": modifiedTime,
      "article:section": "Tin tức",
      ...(post.tags?.length ? { "article:tag": post.tags.slice(0, 5).join(", ") } : {}),
    },
    icons: { icon: "/assets/images/logo.svg" },
  };
}

