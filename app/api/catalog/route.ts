
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCategories, productSubcategories } from "@/lib/schema";
import { ok, serverError } from "@/lib/api-response";
import { ensureDatabaseReady } from "@/lib/bootstrap";

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
      ...category,
      subcategories: subcategories
        .filter((sub) => sub.categoryId === category.id)
        .map((sub) => ({
          ...sub,
          variantSchema: JSON.parse(sub.variantSchemaJson || "[]"),
        })),
    }));

    return ok({ data });
  } catch (error) {
    return serverError("Không thể tải danh mục sản phẩm", {
      error: String(error),
    });
  }
}
