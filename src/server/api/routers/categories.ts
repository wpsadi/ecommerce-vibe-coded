import * as categoryService from "@/lib/categories";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const createCategorySchema = z.object({
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
	description: z.string().optional(),
	icon: z.string().optional(),
	image: z.string().optional(),
	featured: z.boolean().optional(),
	active: z.boolean().optional(),
	sortOrder: z.number().optional(),
	metaTitle: z.string().optional(),
	metaDescription: z.string().optional(),
});

const updateCategorySchema = createCategorySchema.partial().extend({
	id: z.string().min(1, "Category ID is required"),
});

export const categoriesRouter = createTRPCRouter({
	// Get all categories
	getAll: publicProcedure.query(async () => {
		try {
			return await categoryService.getAllCategories();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch categories",
				cause: error,
			});
		}
	}),

	// Get featured categories
	getFeatured: publicProcedure.query(async () => {
		try {
			return await categoryService.getFeaturedCategories();
		} catch (error) {
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
		.query(async ({ input }) => {
			try {
				const category = await categoryService.getCategoryById(input.id);
				if (!category) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Category not found",
					});
				}
				return category;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
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
		.query(async ({ input }) => {
			try {
				const category = await categoryService.getCategoryBySlug(input.slug);
				if (!category) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Category not found",
					});
				}
				return category;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
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
		.mutation(async ({ input, ctx }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			try {
				return await categoryService.createCategory(input);
			} catch (error) {
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
		.mutation(async ({ input, ctx }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			try {
				const { id, ...updateData } = input;
				const category = await categoryService.updateCategory(id, updateData);
				if (!category) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Category not found",
					});
				}
				return category;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
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
		.mutation(async ({ input, ctx }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			try {
				const category = await categoryService.deleteCategory(input.id);
				if (!category) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Category not found",
					});
				}
				return category;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete category",
					cause: error,
				});
			}
		}),

	// Toggle category featured status (admin only)
	toggleFeatured: protectedProcedure
		.input(
			z.object({
				id: z.string().min(1),
				featured: z.boolean(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			try {
				const category = await categoryService.toggleCategoryFeatured(
					input.id,
					input.featured,
				);
				if (!category) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Category not found",
					});
				}
				return category;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update category",
					cause: error,
				});
			}
		}),

	// Update categories sort order (admin only)
	updateSortOrder: protectedProcedure
		.input(
			z.object({
				updates: z.array(
					z.object({
						id: z.string().min(1),
						sortOrder: z.number(),
					}),
				),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			try {
				await categoryService.updateCategorySortOrder(input.updates);
				return { success: true };
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update category sort order",
					cause: error,
				});
			}
		}),
});
