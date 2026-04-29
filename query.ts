import { db } from './lib/db';
import { productSubcategories } from './lib/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const res = await db.select().from(productSubcategories).where(eq(productSubcategories.slug, 'chatgpt'));
  console.log(res[0].variantSchemaJson);
  process.exit(0);
}
main();
