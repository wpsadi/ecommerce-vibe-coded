import { db } from "@/server/db";
import {
	type NewProduct,
	categories,
	productImages,
	productReviews,
	products,
	users,
} from "@/server/db/schema";
import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";

export async function getAllProducts(options?: {
	categoryId?: string;
	featured?: boolean;
	active?: boolean;
	search?: string;
	sortBy?: "name" | "price" | "created_at" | "rating";
	sortOrder?: "asc" | "desc";
	limit?: number;
	offset?: number;
}) {
	const {
		categoryId,
		featured,
		active = true,
		search,
		sortBy = "created_at",
		sortOrder = "desc",
		limit,
		offset = 0,
	} = options || {};

	let query = db
		.select({
			id: products.id,
			name: products.name,
			slug: products.slug,
			description: products.description,
			shortDescription: products.shortDescription,
			sku: products.sku,
			price: products.price,
			originalPrice: products.originalPrice,
			categoryId: products.categoryId,
			stock: products.stock,
			specifications: products.specifications,
			featured: products.featured,
			active: products.active,
			createdAt: products.createdAt,
			updatedAt: products.updatedAt,
			category: {
				id: categories.id,
				name: categories.name,
				slug: categories.slug,
			},
			primaryImage: sql<string>`(
        SELECT url 
        FROM ${productImages} 
        WHERE ${productImages.productId} = ${products.id} 
        AND ${productImages.isPrimary} = true 
        LIMIT 1
      )`.as("primaryImage"),
			averageRating: sql<number>`(
        SELECT COALESCE(AVG(rating), 0)::numeric(3,2)
        FROM ${productReviews} 
        WHERE ${productReviews.productId} = ${products.id} 
        AND ${productReviews.approved} = true
      )`.as("averageRating"),
			reviewCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${productReviews} 
        WHERE ${productReviews.productId} = ${products.id} 
        AND ${productReviews.approved} = true
      )`.as("reviewCount"),
			images: sql<
				Array<{
					id: string;
					url: string;
					isPrimary: boolean;
				}>
			>`(
        SELECT json_agg(json_build_object('id', id, 'url', url, 'isPrimary', is_primary))
        FROM ${productImages}
        WHERE ${productImages.productId} = ${products.id}
      )`.as("images"),
		})
		.from(products)
		.leftJoin(categories, eq(products.categoryId, categories.id));

	// Apply filters
	const conditions = [];

	if (active !== undefined) {
		conditions.push(eq(products.active, active));
	}

	if (categoryId) {
		conditions.push(eq(products.categoryId, categoryId));
	}

	if (featured !== undefined) {
		conditions.push(eq(products.featured, featured));
	}

	if (search) {
		conditions.push(
			or(
				like(products.name, `%${search}%`),
				like(products.description, `%${search}%`),
				like(products.sku, `%${search}%`),
			),
		);
	}

	if (conditions.length > 0) {
		query = (query as any).where(and(...conditions));
	}

	// Apply sorting
	switch (sortBy) {
		case "name":
			query = (query as any).orderBy(
				sortOrder === "asc" ? asc(products.name) : desc(products.name),
			);
			break;
		case "price":
			query = (query as any).orderBy(
				sortOrder === "asc" ? asc(products.price) : desc(products.price),
			);
			break;
		case "rating":
			query = (query as any).orderBy(
				sortOrder === "asc"
					? asc(sql`average_rating`)
					: desc(sql`average_rating`),
			);
			break;
		default:
			query = (query as any).orderBy(
				sortOrder === "asc"
					? asc(products.createdAt)
					: desc(products.createdAt),
			);
	}

	// Apply pagination
	if (limit) {
		query = (query as any).limit(limit);
	}

	if (offset > 0) {
		query = (query as any).offset(offset);
	}

	return await query;
}

export async function getProductById(id: string) {
	const result = await db
		.select({
			id: products.id,
			name: products.name,
			slug: products.slug,
			description: products.description,
			shortDescription: products.shortDescription,
			sku: products.sku,
			price: products.price,
			originalPrice: products.originalPrice,
			categoryId: products.categoryId,
			stock: products.stock,
			lowStockThreshold: products.lowStockThreshold,
			weight: products.weight,
			dimensions: products.dimensions,
			specifications: products.specifications,
			tags: products.tags,
			featured: products.featured,
			active: products.active,
			digital: products.digital,
			trackQuantity: products.trackQuantity,
			allowBackorder: products.allowBackorder,
			metaTitle: products.metaTitle,
			metaDescription: products.metaDescription,
			createdAt: products.createdAt,
			updatedAt: products.updatedAt,
			category: {
				id: categories.id,
				name: categories.name,
				slug: categories.slug,
			},
		})
		.from(products)
		.leftJoin(categories, eq(products.categoryId, categories.id))
		.where(eq(products.id, id))
		.limit(1);

	return result[0] || null;
}

export async function getProductBySlug(slug: string) {
	const result = await db
		.select({
			id: products.id,
			name: products.name,
			slug: products.slug,
			description: products.description,
			shortDescription: products.shortDescription,
			sku: products.sku,
			price: products.price,
			originalPrice: products.originalPrice,
			categoryId: products.categoryId,
			stock: products.stock,
			lowStockThreshold: products.lowStockThreshold,
			weight: products.weight,
			dimensions: products.dimensions,
			specifications: products.specifications,
			tags: products.tags,
			featured: products.featured,
			active: products.active,
			digital: products.digital,
			trackQuantity: products.trackQuantity,
			allowBackorder: products.allowBackorder,
			metaTitle: products.metaTitle,
			metaDescription: products.metaDescription,
			createdAt: products.createdAt,
			updatedAt: products.updatedAt,
			category: {
				id: categories.id,
				name: categories.name,
				slug: categories.slug,
			},
		})
		.from(products)
		.leftJoin(categories, eq(products.categoryId, categories.id))
		.where(eq(products.slug, slug))
		.limit(1);

	return result[0] || null;
}

export async function getProductImages(productId: string) {
	return await db
		.select()
		.from(productImages)
		.where(eq(productImages.productId, productId))
		.orderBy(asc(productImages.sortOrder), desc(productImages.isPrimary));
}

export async function getProductReviews(
	productId: string,
	options?: {
		approved?: boolean;
		limit?: number;
		offset?: number;
	},
) {
	const { approved = true, limit, offset = 0 } = options || {};

	let query = db
		.select({
			id: productReviews.id,
			rating: productReviews.rating,
			title: productReviews.title,
			comment: productReviews.comment,
			verified: productReviews.verified,
			helpful: productReviews.helpful,
			createdAt: productReviews.createdAt,
			user: {
				id: users.id,
				name: users.name,
			},
		})
		.from(productReviews)
		.leftJoin(users, eq(productReviews.userId, users.id))
		.where(
			and(
				eq(productReviews.productId, productId),
				eq(productReviews.approved, approved),
			),
		)
		.orderBy(desc(productReviews.createdAt));

	if (limit) {
		query = (query as any).limit(limit);
	}

	if (offset > 0) {
		query = (query as any).offset(offset);
	}

	return await query;
}

export async function createProduct(data: NewProduct) {
	const result = await db.insert(products).values(data).returning();
	return result[0];
}

export async function updateProduct(id: string, data: Partial<NewProduct>) {
	const result = await db
		.update(products)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(products.id, id))
		.returning();

	return result[0] || null;
}

export async function deleteProduct(id: string) {
	const result = await db
		.delete(products)
		.where(eq(products.id, id))
		.returning();

	return result[0] || null;
}

export async function updateProductStock(id: string, quantity: number) {
	const result = await db
		.update(products)
		.set({
			stock: sql`${products.stock} + ${quantity}`,
			updatedAt: new Date(),
		})
		.where(eq(products.id, id))
		.returning();

	return result[0] || null;
}

export async function getLowStockProducts(threshold?: number) {
	return await db
		.select({
			id: products.id,
			name: products.name,
			sku: products.sku,
			stock: products.stock,
			lowStockThreshold: products.lowStockThreshold,
			category: {
				name: categories.name,
			},
		})
		.from(products)
		.leftJoin(categories, eq(products.categoryId, categories.id))
		.where(
			and(
				eq(products.active, true),
				eq(products.trackQuantity, true),
				threshold
					? sql`${products.stock} <= ${threshold}`
					: sql`${products.stock} <= ${products.lowStockThreshold}`,
			),
		)
		.orderBy(asc(products.stock));
}

export async function assignProductsToCategory(
	productIds: string[],
	categoryId: string,
) {
	const result = await db
		.update(products)
		.set({ categoryId, updatedAt: new Date() })
		.where(inArray(products.id, productIds))
		.returning();

	return result;
}
