import { categories as mockCategories } from "@/lib/mock-data";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { categories, products } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

const createCategorySchema = z.object({
	name: z.string().min(1).max(255),
	slug: z.string().min(1).max(255),
	description: z.string().optional(),
	icon: z.string().max(10).optional(),
	image: z.string().max(500).optional(),
	featured: z.boolean().default(false),
	active: z.boolean().default(true),
	sortOrder: z.number().int().default(0),
	metaTitle: z.string().max(255).optional(),
	metaDescription: z.string().optional(),
});

const updateCategorySchema = createCategorySchema.partial().extend({
	id: z.string().min(1),
});

// Helper function to handle database fallback
async function withDatabaseFallback<T>(
	dbOperation: () => Promise<T>,
	fallbackOperation: () => T,
): Promise<T> {
	try {
		return await dbOperation();
	} catch (error) {
		console.warn(
			"Database operation failed, falling back to mock data:",
			error,
		);
		return fallbackOperation();
	}
}

// Helper function to check admin permission
function checkAdminPermission(ctx: any) {
	if (!ctx.session?.user?.role || ctx.session.user.role !== "admin") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only admins can perform this action",
		});
	}
}

export const categoriesRouter = createTRPCRouter({
	// Get all categories with product counts
	getAll: publicProcedure.query(async ({ ctx }) => {
		try {
			return await withDatabaseFallback(
				async () => {
					// Database operation
					const categoriesWithCounts = await ctx.db
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
							productCount: sql<number>`COALESCE(COUNT(${products.id}), 0)`,
						})
						.from(categories)
						.leftJoin(
							products,
							and(
								eq(products.categoryId, categories.id),
								eq(products.active, true),
							),
						)
						.where(eq(categories.active, true))
						.groupBy(categories.id)
						.orderBy(categories.sortOrder, categories.name);

					return categoriesWithCounts.map((cat) => ({
						...cat,
						productCount: Number(cat.productCount),
					}));
				},
				() => {
					// Fallback to mock data
					return mockCategories.map((cat) => ({
						id: cat.id,
						name: cat.name,
						slug: cat.id,
						description: cat.description,
						icon: cat.icon,
						image: cat.image,
						featured: cat.featured,
						active: true,
						sortOrder: 0,
						metaTitle: null,
						metaDescription: null,
						productCount: cat.productCount,
						createdAt: new Date(cat.createdAt),
						updatedAt: new Date(cat.updatedAt),
					}));
				},
			);
		} catch (error) {
			console.error("Categories getAll error:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch categories",
				cause: error,
			});
		}
	}),

	// Get featured categories
	getFeatured: publicProcedure.query(async ({ ctx }) => {
		try {
			return await withDatabaseFallback(
				async () => {
					const categoriesWithCounts = await ctx.db
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
							productCount: sql<number>`COALESCE(COUNT(${products.id}), 0)`,
						})
						.from(categories)
						.leftJoin(
							products,
							and(
								eq(products.categoryId, categories.id),
								eq(products.active, true),
							),
						)
						.where(
							and(eq(categories.active, true), eq(categories.featured, true)),
						)
						.groupBy(categories.id)
						.orderBy(categories.sortOrder, categories.name);

					return categoriesWithCounts.map((cat) => ({
						...cat,
						productCount: Number(cat.productCount),
					}));
				},
				() => {
					// Fallback to mock data
					return mockCategories
						.filter((cat) => cat.featured)
						.map((cat) => ({
							id: cat.id,
							name: cat.name,
							slug: cat.id,
							description: cat.description,
							icon: cat.icon,
							image: cat.image,
							featured: cat.featured,
							active: true,
							sortOrder: 0,
							metaTitle: null,
							metaDescription: null,
							productCount: cat.productCount,
							createdAt: new Date(cat.createdAt),
							updatedAt: new Date(cat.updatedAt),
						}));
				},
			);
		} catch (error) {
			console.error("Categories getFeatured error:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch featured categories",
				cause: error,
			});
		}
	}),

	// Get category by ID
	getById: publicProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			try {
				return await withDatabaseFallback(
					async () => {
						const categoryWithCount = await ctx.db
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
								productCount: sql<number>`COALESCE(COUNT(${products.id}), 0)`,
							})
							.from(categories)
							.leftJoin(
								products,
								and(
									eq(products.categoryId, categories.id),
									eq(products.active, true),
								),
							)
							.where(eq(categories.id, input.id))
							.groupBy(categories.id)
							.limit(1);

						if (!categoryWithCount[0]) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Category not found",
							});
						}

						return {
							...categoryWithCount[0],
							productCount: Number(categoryWithCount[0].productCount),
						};
					},
					() => {
						// Fallback to mock data
						const category = mockCategories.find((cat) => cat.id === input.id);
						if (!category) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Category not found",
							});
						}

						return {
							id: category.id,
							name: category.name,
							slug: category.id,
							description: category.description,
							icon: category.icon,
							image: category.image,
							featured: category.featured,
							active: true,
							sortOrder: 0,
							metaTitle: null,
							metaDescription: null,
							productCount: category.productCount,
							createdAt: new Date(category.createdAt),
							updatedAt: new Date(category.updatedAt),
						};
					},
				);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Categories getById error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch category",
					cause: error,
				});
			}
		}),

	// Get category by slug
	getBySlug: publicProcedure
		.input(z.object({ slug: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			try {
				return await withDatabaseFallback(
					async () => {
						const categoryWithCount = await ctx.db
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
								productCount: sql<number>`COALESCE(COUNT(${products.id}), 0)`,
							})
							.from(categories)
							.leftJoin(
								products,
								and(
									eq(products.categoryId, categories.id),
									eq(products.active, true),
								),
							)
							.where(eq(categories.slug, input.slug))
							.groupBy(categories.id)
							.limit(1);

						if (!categoryWithCount[0]) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Category not found",
							});
						}

						return {
							...categoryWithCount[0],
							productCount: Number(categoryWithCount[0].productCount),
						};
					},
					() => {
						// Fallback to mock data (use id as slug for mock)
						const category = mockCategories.find(
							(cat) => cat.id === input.slug,
						);
						if (!category) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Category not found",
							});
						}

						return {
							id: category.id,
							name: category.name,
							slug: category.id,
							description: category.description,
							icon: category.icon,
							image: category.image,
							featured: category.featured,
							active: true,
							sortOrder: 0,
							metaTitle: null,
							metaDescription: null,
							productCount: category.productCount,
							createdAt: new Date(category.createdAt),
							updatedAt: new Date(category.updatedAt),
						};
					},
				);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Categories getBySlug error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch category",
					cause: error,
				});
			}
		}),

	// Create category (admin only)
	create: protectedProcedure
		.input(createCategorySchema)
		.mutation(async ({ ctx, input }) => {
			try {
				checkAdminPermission(ctx);

				// For now, just return a mock response since database isn't set up
				throw new TRPCError({
					code: "NOT_IMPLEMENTED",
					message:
						"Category creation is not yet implemented. Database setup required.",
				});
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Categories create error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create category",
					cause: error,
				});
			}
		}),

	// Update category (admin only)
	update: protectedProcedure
		.input(updateCategorySchema)
		.mutation(async ({ ctx, input }) => {
			try {
				checkAdminPermission(ctx);

				throw new TRPCError({
					code: "NOT_IMPLEMENTED",
					message:
						"Category update is not yet implemented. Database setup required.",
				});
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Categories update error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update category",
					cause: error,
				});
			}
		}),

	// Delete category (admin only)
	delete: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				checkAdminPermission(ctx);

				throw new TRPCError({
					code: "NOT_IMPLEMENTED",
					message:
						"Category deletion is not yet implemented. Database setup required.",
				});
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Categories delete error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete category",
					cause: error,
				});
			}
		}),

	// Toggle featured status (admin only)
	toggleFeatured: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			try {
				checkAdminPermission(ctx);

				throw new TRPCError({
					code: "NOT_IMPLEMENTED",
					message:
						"Toggle featured is not yet implemented. Database setup required.",
				});
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Categories toggleFeatured error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to toggle featured status",
					cause: error,
				});
			}
		}),
});
