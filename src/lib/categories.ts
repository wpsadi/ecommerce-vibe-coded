import { eq, asc, and, sql } from "drizzle-orm"


import { db } from "@/server/db"
import { categories, products, type NewCategory } from "@/server/db/schema"

export async function getAllCategories() {
  return await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      icon: categories.icon,
      image: categories.image,
      featured: categories.featured,
      active: categories.active,
      sortOrder: categories.sortOrder,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      productCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM ${products} 
        WHERE ${products.categoryId} = ${categories.id} 
        AND ${products.active} = true
      )`.as("productCount"),
    })
    .from(categories)
    .where(eq(categories.active, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name))
}

export async function getFeaturedCategories() {
  return await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      icon: categories.icon,
      image: categories.image,
      featured: categories.featured,
      active: categories.active,
      sortOrder: categories.sortOrder,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      productCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM ${products} 
        WHERE ${products.categoryId} = ${categories.id} 
        AND ${products.active} = true
      )`.as("productCount"),
    })
    .from(categories)
    .where(and(eq(categories.active, true), eq(categories.featured, true)))
    .orderBy(asc(categories.sortOrder), asc(categories.name))
}

export async function getCategoryById(id: string) {
  const result = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      icon: categories.icon,
      image: categories.image,
      featured: categories.featured,
      active: categories.active,
      sortOrder: categories.sortOrder,
      metaTitle: categories.metaTitle,
      metaDescription: categories.metaDescription,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      productCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM ${products} 
        WHERE ${products.categoryId} = ${categories.id} 
        AND ${products.active} = true
      )`.as("productCount"),
    })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)

  return result[0] || null
}

export async function getCategoryBySlug(slug: string) {
  const result = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      icon: categories.icon,
      image: categories.image,
      featured: categories.featured,
      active: categories.active,
      sortOrder: categories.sortOrder,
      metaTitle: categories.metaTitle,
      metaDescription: categories.metaDescription,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      productCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM ${products} 
        WHERE ${products.categoryId} = ${categories.id} 
        AND ${products.active} = true
      )`.as("productCount"),
    })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1)

  return result[0] || null
}

export async function createCategory(data: NewCategory) {
  const result = await db.insert(categories).values(data).returning()
  return result[0]
}

export async function updateCategory(id: string, data: Partial<NewCategory>) {
  const result = await db
    .update(categories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(categories.id, id))
    .returning()

  return result[0] || null
}

export async function deleteCategory(id: string) {
  // Check if category has products
  const productCount = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(products)
    .where(eq(products.categoryId, id))

  if (productCount[0]?.count > 0) {
    throw new Error("Cannot delete category with existing products")
  }

  const result = await db.delete(categories).where(eq(categories.id, id)).returning()

  return result[0] || null
}

export async function toggleCategoryFeatured(id: string, featured: boolean) {
  const result = await db
    .update(categories)
    .set({ featured, updatedAt: new Date() })
    .where(eq(categories.id, id))
    .returning()

  return result[0] || null
}

export async function updateCategorySortOrder(updates: Array<{ id: string; sortOrder: number }>) {
  const promises = updates.map(({ id, sortOrder }) =>
    db.update(categories).set({ sortOrder, updatedAt: new Date() }).where(eq(categories.id, id)),
  )

  await Promise.all(promises)
}
