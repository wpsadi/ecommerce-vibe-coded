import { categories } from "@/lib/mock-data";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const categoriesRouter = createTRPCRouter({
	// Get all categories
	getAll: publicProcedure.query(async () => {
		try {
			return categories.map(cat => ({
				id: cat.id,
				name: cat.name,
				slug: cat.id,
				description: cat.description,
				icon: cat.icon,
				image: cat.image,
				featured: cat.featured,
				active: true,
				productCount: cat.productCount,
				createdAt: new Date(cat.createdAt),
				updatedAt: new Date(cat.updatedAt),
			}));
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
	getFeatured: publicProcedure.query(async () => {
		try {
			return categories
				.filter(cat => cat.featured)
				.map(cat => ({
					id: cat.id,
					name: cat.name,
					slug: cat.id,
					description: cat.description,
					icon: cat.icon,
					image: cat.image,
					featured: cat.featured,
					active: true,
					productCount: cat.productCount,
					createdAt: new Date(cat.createdAt),
					updatedAt: new Date(cat.updatedAt),
				}));
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
		.query(async ({ input }) => {
			try {
				const category = categories.find(cat => cat.id === input.id);
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
					productCount: category.productCount,
					createdAt: new Date(category.createdAt),
					updatedAt: new Date(category.updatedAt),
				};
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
});
