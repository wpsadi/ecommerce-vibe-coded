import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	categories,
	productImages,
	products,
	wishlistItems,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

export const wishlistRouter = createTRPCRouter({
	// Get user's wishlist items
	getItems: protectedProcedure.query(async ({ ctx }) => {
		try {
			return await ctx.db
				.select({
					id: wishlistItems.id,
					createdAt: wishlistItems.createdAt,
					product: {
						id: products.id,
						name: products.name,
						slug: products.slug,
						price: products.price,
						originalPrice: products.originalPrice,
						stock: products.stock,
						active: products.active,
						category: {
							id: categories.id, // Ensure this matches the schema or remove if not applicable
							name: categories.name as unknown as string, // Explicitly cast to string
						},
					},
					primaryImage: {
						url: productImages.url,
						altText: productImages.altText,
					},
				})
				.from(wishlistItems)
				.leftJoin(products, eq(wishlistItems.productId, products.id))
				.leftJoin(categories, eq(products.categoryId, categories.id))
				.leftJoin(
					productImages,
					and(
						eq(productImages.productId, products.id),
						eq(productImages.isPrimary, true),
					),
				)
				.where(eq(wishlistItems.userId, ctx.session.user.id))
				.orderBy(desc(wishlistItems.createdAt));
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch wishlist items",
				cause: error,
			});
		}
	}),

	// Add item to wishlist
	addItem: protectedProcedure
		.input(
			z.object({
				productId: z.string().min(1),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			try {
				// Check if product exists and is active
				const product = await ctx.db
					.select({
						id: products.id,
						active: products.active,
					})
					.from(products)
					.where(eq(products.id, input.productId))
					.limit(1);

				if (!product[0]) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Product not found",
					});
				}

				if (!product[0].active) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Product is not available",
					});
				}

				// Check if item already exists in wishlist
				const existingItem = await ctx.db
					.select()
					.from(wishlistItems)
					.where(
						and(
							eq(wishlistItems.userId, ctx.session.user.id),
							eq(wishlistItems.productId, input.productId),
						),
					)
					.limit(1);

				if (existingItem[0]) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Product already in wishlist",
					});
				}

				// Create new wishlist item
				const result = await ctx.db
					.insert(wishlistItems)
					.values({
						userId: ctx.session.user.id,
						productId: input.productId,
					})
					.returning();

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to add item to wishlist",
					cause: error,
				});
			}
		}),

	// Remove item from wishlist
	removeItem: protectedProcedure
		.input(z.object({ itemId: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			try {
				// Verify the wishlist item belongs to the user
				const wishlistItem = await ctx.db
					.select({ userId: wishlistItems.userId })
					.from(wishlistItems)
					.where(eq(wishlistItems.id, input.itemId))
					.limit(1);

				if (
					!wishlistItem[0] ||
					wishlistItem[0].userId !== ctx.session.user.id
				) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Wishlist item not found",
					});
				}

				const result = await ctx.db
					.delete(wishlistItems)
					.where(eq(wishlistItems.id, input.itemId))
					.returning();

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to remove wishlist item",
					cause: error,
				});
			}
		}),

	// Remove item by product ID
	removeByProductId: protectedProcedure
		.input(z.object({ productId: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			try {
				const result = await ctx.db
					.delete(wishlistItems)
					.where(
						and(
							eq(wishlistItems.userId, ctx.session.user.id),
							eq(wishlistItems.productId, input.productId),
						),
					)
					.returning();

				if (!result[0]) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Wishlist item not found",
					});
				}

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to remove wishlist item",
					cause: error,
				});
			}
		}),

	// Clear wishlist
	clearWishlist: protectedProcedure.mutation(async ({ ctx }) => {
		try {
			await ctx.db
				.delete(wishlistItems)
				.where(eq(wishlistItems.userId, ctx.session.user.id));

			return { success: true };
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to clear wishlist",
				cause: error,
			});
		}
	}),

	// Check if product is in wishlist
	isInWishlist: protectedProcedure
		.input(z.object({ productId: z.string().min(1) }))
		.query(async ({ input, ctx }) => {
			try {
				const item = await ctx.db
					.select({ id: wishlistItems.id })
					.from(wishlistItems)
					.where(
						and(
							eq(wishlistItems.userId, ctx.session.user.id),
							eq(wishlistItems.productId, input.productId),
						),
					)
					.limit(1);

				return { isInWishlist: !!item[0] };
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to check wishlist status",
					cause: error,
				});
			}
		}),

	// Get wishlist count
	getCount: protectedProcedure.query(async ({ ctx }) => {
		try {
			const result = await ctx.db
				.select({ count: wishlistItems.id })
				.from(wishlistItems)
				.where(eq(wishlistItems.userId, ctx.session.user.id));

			return { count: result.length };
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to get wishlist count",
				cause: error,
			});
		}
	}),
});
