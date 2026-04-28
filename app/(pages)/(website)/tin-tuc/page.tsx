
import Container from "@/components/modules/custom/Container";
import { getPublishedNewsPage } from "@/actions/news";
import { mergeOpenGraph } from "@/lib/mergeOpenGraph";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const NEWS_PER_PAGE = 50;

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

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const pageRaw = Number(resolvedSearchParams.page || 1);
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;
  const { items, pagination } = await getPublishedNewsPage(page, NEWS_PER_PAGE);

  return (
    <section className="py-8 lg:py-12 bg-slate-50 min-h-[70vh]">
      <Container>
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
            Tin tức
          </p>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mt-2">
            Cập nhật kiến thức, xu hướng và mẹo thực chiến
          </h1>
          <p className="text-slate-600 mt-3">
            Danh sách tin tức chỉ hiển thị tại chuyên mục này, không hiển thị ở trang chủ.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Chưa có bài viết tin tức nào được xuất bản.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <Link href={`/tin-tuc/${post.slug}`} className="block">
                  <div className="relative aspect-[16/9] bg-slate-100">
                    <Image
                      src={post.coverImage || "/assets/images/logo.svg"}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-500">
                      {formatDate(post.publishedAt || post.createdAt)}
                    </p>
                    <h2 className="text-lg font-bold text-slate-900 line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {post.excerpt || "Xem chi tiết nội dung bài viết..."}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(post.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={`${post.id}-${tag}`}
                          className="inline-flex text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
            <Link
              href={pagination.hasPrev ? `/tin-tuc?page=${pagination.page - 1}` : "#"}
              aria-disabled={!pagination.hasPrev}
              className={`px-3 py-2 rounded-lg border text-sm ${
                pagination.hasPrev
                  ? "border-slate-300 bg-white hover:bg-slate-100"
                  : "border-slate-200 bg-slate-100 text-slate-400 pointer-events-none"
              }`}
            >
              Trang trước
            </Link>

            <span className="text-sm text-slate-600 px-2">
              Trang {pagination.page}/{pagination.totalPages}
            </span>

            <Link
              href={pagination.hasNext ? `/tin-tuc?page=${pagination.page + 1}` : "#"}
              aria-disabled={!pagination.hasNext}
              className={`px-3 py-2 rounded-lg border text-sm ${
                pagination.hasNext
                  ? "border-slate-300 bg-white hover:bg-slate-100"
                  : "border-slate-200 bg-slate-100 text-slate-400 pointer-events-none"
              }`}
            >
              Trang sau
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}

export const metadata: Metadata = {
  title: "Tin tức | KHOMANGUON.IO.VN",
  description:
    "Tin tức công nghệ, mã nguồn, tài khoản số, AI và xu hướng thương mại điện tử cập nhật liên tục.",
  keywords: [
    "tin tức công nghệ",
    "tin tức mã nguồn",
    "AI",
    "thương mại điện tử",
    "khomanguon",
  ],
  openGraph: mergeOpenGraph({
    title: "Tin tức | KHOMANGUON.IO.VN",
    url: "/tin-tuc",
  }),
};
