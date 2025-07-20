import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { wishlistItems, products, productImages, categories } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, count } from "drizzle-orm";
import { z } from "zod";

export const wishlistRouter = createTRPCRouter({
	// Get user's wishlist items
	getItems: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.session.user.id;

			const wishlistData = await db
				.select({
					wishlistItem: wishlistItems,
					product: products,
					category: categories,
					primaryImage: productImages.url,
				})
				.from(wishlistItems)
				.leftJoin(products, eq(wishlistItems.productId, products.id))
				.leftJoin(categories, eq(products.categoryId, categories.id))
				.leftJoin(
					productImages,
					and(
						eq(productImages.productId, products.id),
						eq(productImages.isPrimary, true)
					)
				)
				.where(eq(wishlistItems.userId, userId));

			return wishlistData.map(({ wishlistItem, product, category, primaryImage }) => {
				if (!product) {
					// Remove invalid wishlist items
					db.delete(wishlistItems).where(eq(wishlistItems.id, wishlistItem.id));
					return null;
				}

				return {
					id: wishlistItem.id,
					createdAt: wishlistItem.createdAt,
					product: {
						id: product.id,
						name: product.name,
						slug: product.slug,
						price: Number(product.price),
						originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
						stock: product.stock,
						active: product.active,
						image: primaryImage || "/placeholder-product.jpg",
						category: category ? {
							id: category.id,
							name: category.name,
						} : null,
					},
				};
			}).filter(Boolean); // Remove null entries
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch wishlist items",
				cause: error,
			});
		}
	}),

	// Get wishlist count
	getCount: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.session.user.id;

			const result = await db
				.select({ count: count() })
				.from(wishlistItems)
				.where(eq(wishlistItems.userId, userId));

			return { count: result[0]?.count || 0 };
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch wishlist count",
				cause: error,
			});
		}
	}),

	// Check if product is in wishlist
	isInWishlist: protectedProcedure
		.input(z.object({ productId: z.string() }))
		.query(async ({ input, ctx }) => {
			try {
				const userId = ctx.session.user.id;

				const item = await db.query.wishlistItems.findFirst({
					where: and(
						eq(wishlistItems.userId, userId),
						eq(wishlistItems.productId, input.productId)
					),
				});

				return { isInWishlist: !!item };
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to check wishlist status",
					cause: error,
				});
			}
		}),

	// Add item to wishlist
	addItem: protectedProcedure
		.input(z.object({ productId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			try {
				const userId = ctx.session.user.id;

				// Check if product exists and is active
				const product = await db.query.products.findFirst({
					where: and(eq(products.id, input.productId), eq(products.active, true)),
				});

				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Product not found or inactive",
					});
				}

				// Check if item already exists in wishlist
				const existingItem = await db.query.wishlistItems.findFirst({
					where: and(
						eq(wishlistItems.userId, userId),
						eq(wishlistItems.productId, input.productId)
					),
				});

				if (existingItem) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Item already in wishlist",
					});
				}

				// Add new item
				const [newItem] = await db
					.insert(wishlistItems)
					.values({
						userId,
						productId: input.productId,
					})
					.returning();

				return newItem;
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to add item to wishlist",
					cause: error,
				});
			}
		}),

	// Remove item from wishlist by wishlist item ID
	removeItem: protectedProcedure
		.input(z.object({ itemId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			try {
				const userId = ctx.session.user.id;

				// Verify ownership and delete
				const [deleted] = await db
					.delete(wishlistItems)
					.where(and(eq(wishlistItems.id, input.itemId), eq(wishlistItems.userId, userId)))
					.returning();

				if (!deleted) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Wishlist item not found",
					});
				}

				return deleted;
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to remove item from wishlist",
					cause: error,
				});
			}
		}),

	// Remove item from wishlist by product ID
	removeByProductId: protectedProcedure
		.input(z.object({ productId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			try {
				const userId = ctx.session.user.id;

				// Find and delete the wishlist item
				const [deleted] = await db
					.delete(wishlistItems)
					.where(and(
						eq(wishlistItems.userId, userId),
						eq(wishlistItems.productId, input.productId)
					))
					.returning();

				if (!deleted) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Item not found in wishlist",
					});
				}

				return deleted;
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to remove item from wishlist",
					cause: error,
				});
			}
		}),

	// Clear wishlist
	clearWishlist: protectedProcedure.mutation(async ({ ctx }) => {
		try {
			const userId = ctx.session.user.id;

			await db.delete(wishlistItems).where(eq(wishlistItems.userId, userId));

			return { success: true };
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to clear wishlist",
				cause: error,
			});
		}
	}),
});