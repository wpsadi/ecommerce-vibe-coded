import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const wishlistRouter = createTRPCRouter({
	// Get user's wishlist items (mock implementation)
	getItems: publicProcedure.query(async () => {
		try {
			// Return empty wishlist for now
			return [];
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch wishlist items",
				cause: error,
			});
		}
	}),

	// Get wishlist count
	getCount: publicProcedure.query(async () => {
		try {
			return { count: 0 };
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch wishlist count",
				cause: error,
			});
		}
	}),

	// Check if product is in wishlist
	isInWishlist: publicProcedure
		.input(z.object({ productId: z.string() }))
		.query(async ({ input }) => {
			try {
				return { isInWishlist: false };
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to check wishlist status",
					cause: error,
				});
			}
		}),

	// Add item to wishlist
	addItem: publicProcedure
		.input(z.object({ productId: z.string() }))
		.mutation(async ({ input }) => {
			try {
				console.log("Adding to wishlist:", input);
				return { success: true };
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to add item to wishlist",
					cause: error,
				});
			}
		}),

	// Remove item from wishlist
	removeItem: publicProcedure
		.input(z.object({ itemId: z.string() }))
		.mutation(async ({ input }) => {
			try {
				console.log("Removing from wishlist:", input);
				return { success: true };
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to remove item from wishlist",
					cause: error,
				});
			}
		}),

	// Remove by product ID
	removeByProductId: publicProcedure
		.input(z.object({ productId: z.string() }))
		.mutation(async ({ input }) => {
			try {
				console.log("Removing from wishlist by product ID:", input);
				return { success: true };
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to remove item from wishlist",
					cause: error,
				});
			}
		}),

	// Clear wishlist
	clearWishlist: publicProcedure.mutation(async () => {
		try {
			console.log("Clearing wishlist");
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
