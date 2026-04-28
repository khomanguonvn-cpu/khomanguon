
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCategories, productSubcategories } from "@/lib/schema";
import { ensureDatabaseReady } from "@/lib/bootstrap";
import { ok, serverError } from "@/lib/api-response";

export async function GET() {
  try {
    await ensureDatabaseReady();

    const categories = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.isActive, true))
      .orderBy(asc(productCategories.sortOrder));

    const subcategories = await db
      .select()
      .from(productSubcategories)
      .where(eq(productSubcategories.isActive, true))
      .orderBy(asc(productSubcategories.sortOrder));

    const data = categories.map((category) => ({
      _id: String(category.id),
      name: category.name,
      link: category.slug,
      slug: category.slug,
      image: `/assets/images/placeholders/${category.slug}.png`,
      submenu: subcategories
        .filter((sub) => sub.categoryId === category.id)
        .map((sub) => ({
          _id: String(sub.id),
          name: sub.name,
          link: sub.slug,
          slug: sub.slug,
          parent: String(category.id),
        })),
    }));

    return ok({ data });
  } catch (error) {
    return serverError("Không thể tải danh mục", { error: String(error) });
  }
}
