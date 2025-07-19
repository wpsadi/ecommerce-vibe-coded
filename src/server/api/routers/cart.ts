import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	cartItems,
	categories,
	productImages,
	products,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

export const cartRouter = createTRPCRouter({
	// Get user's cart items
	getItems: protectedProcedure.query(async ({ ctx }) => {
		try {
			return await ctx.db
				.select({
					id: cartItems.id,
					quantity: cartItems.quantity,
					createdAt: cartItems.createdAt,
					updatedAt: cartItems.updatedAt,
					productId: products.id,
					productName: products.name,
					productSlug: products.slug,
					productPrice: products.price,
					productOriginalPrice: products.originalPrice,
					productStock: products.stock,
					productActive: products.active,
					categoryName: categories.name,
					imageUrl: productImages.url,
					imageAltText: productImages.altText,
				})
				.from(cartItems)
				.leftJoin(products, eq(cartItems.productId, products.id))
				.leftJoin(categories, eq(products.categoryId, categories.id))
				.leftJoin(
					productImages,
					and(
						eq(productImages.productId, products.id),
						eq(productImages.isPrimary, true),
					),
				)
				.where(eq(cartItems.userId, ctx.session.user.id))
				.orderBy(desc(cartItems.updatedAt));
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch cart items",
				cause: error,
			});
		}
	}),

	// Add item to cart
	addItem: protectedProcedure
		.input(
			z.object({
				productId: z.string().min(1),
				quantity: z.number().min(1).max(99),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			try {
				// Check if product exists and is active
				const product = await ctx.db
					.select({
						id: products.id,
						stock: products.stock,
						active: products.active,
						trackQuantity: products.trackQuantity,
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

				if (product[0].trackQuantity && product[0].stock < input.quantity) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Insufficient stock",
					});
				}

				// Check if item already exists in cart
				const existingItem = await ctx.db
					.select()
					.from(cartItems)
					.where(
						and(
							eq(cartItems.userId, ctx.session.user.id),
							eq(cartItems.productId, input.productId),
						),
					)
					.limit(1);

				if (existingItem[0]) {
					// Update quantity
					const newQuantity = existingItem[0].quantity + input.quantity;

					if (product[0].trackQuantity && product[0].stock < newQuantity) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Insufficient stock for requested quantity",
						});
					}

					const result = await ctx.db
						.update(cartItems)
						.set({
							quantity: newQuantity,
							updatedAt: new Date(),
						})
						.where(eq(cartItems.id, existingItem[0].id))
						.returning();

					return result[0];
				}

				// Create new cart item
				const result = await ctx.db
					.insert(cartItems)
					.values({
						userId: ctx.session.user.id,
						productId: input.productId,
						quantity: input.quantity,
					})
					.returning();

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to add item to cart",
					cause: error,
				});
			}
		}),

	// Update item quantity
	updateQuantity: protectedProcedure
		.input(
			z.object({
				itemId: z.string().min(1),
				quantity: z.number().min(1).max(99),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			try {
				// Verify the cart item belongs to the user
				const cartItem = await ctx.db
					.select({
						id: cartItems.id,
						productId: cartItems.productId,
						userId: cartItems.userId,
					})
					.from(cartItems)
					.where(eq(cartItems.id, input.itemId))
					.limit(1);

				if (!cartItem[0] || cartItem[0].userId !== ctx.session.user.id) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Cart item not found",
					});
				}

				// Check product stock
				const product = await ctx.db
					.select({
						stock: products.stock,
						trackQuantity: products.trackQuantity,
					})
					.from(products)
					.where(eq(products.id, cartItem[0].productId))
					.limit(1);

				if (product[0]?.trackQuantity && product[0].stock < input.quantity) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Insufficient stock",
					});
				}

				const result = await ctx.db
					.update(cartItems)
					.set({
						quantity: input.quantity,
						updatedAt: new Date(),
					})
					.where(eq(cartItems.id, input.itemId))
					.returning();

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update cart item",
					cause: error,
				});
			}
		}),

	// Remove item from cart
	removeItem: protectedProcedure
		.input(z.object({ itemId: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			try {
				// Verify the cart item belongs to the user
				const cartItem = await ctx.db
					.select({ userId: cartItems.userId })
					.from(cartItems)
					.where(eq(cartItems.id, input.itemId))
					.limit(1);

				if (!cartItem[0] || cartItem[0].userId !== ctx.session.user.id) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Cart item not found",
					});
				}

				const result = await ctx.db
					.delete(cartItems)
					.where(eq(cartItems.id, input.itemId))
					.returning();

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to remove cart item",
					cause: error,
				});
			}
		}),

	// Clear cart
	clearCart: protectedProcedure.mutation(async ({ ctx }) => {
		try {
			await ctx.db
				.delete(cartItems)
				.where(eq(cartItems.userId, ctx.session.user.id));

			return { success: true };
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to clear cart",
				cause: error,
			});
		}
	}),

	// Get cart summary
	getSummary: protectedProcedure.query(async ({ ctx }) => {
		try {
			const items = await ctx.db
				.select({
					quantity: cartItems.quantity,
					price: products.price,
					originalPrice: products.originalPrice,
				})
				.from(cartItems)
				.leftJoin(products, eq(cartItems.productId, products.id))
				.where(eq(cartItems.userId, ctx.session.user.id));

			const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
			const subtotal = items.reduce((sum, item) => {
				const price = Number.parseFloat(item.price || "0");
				return sum + price * item.quantity;
			}, 0);

			const originalTotal = items.reduce((sum, item) => {
				const originalPrice = Number.parseFloat(
					item.originalPrice || item.price || "0",
				);
				return sum + originalPrice * item.quantity;
			}, 0);

			const savings = originalTotal - subtotal;

			return {
				totalItems,
				subtotal: subtotal.toFixed(2),
				originalTotal: originalTotal.toFixed(2),
				savings: savings.toFixed(2),
			};
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to get cart summary",
				cause: error,
			});
		}
	}),
});
