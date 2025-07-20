import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { cartItems, products, productImages } from "@/server/db/schema-pg";
import { TRPCError } from "@trpc/server";
import { and, eq, sum } from "drizzle-orm";
import { z } from "zod";

export const cartRouter = createTRPCRouter({
	// Get user's cart items with product details
	getItems: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.session.user.id;

			const cartData = await db
				.select({
					cartItem: cartItems,
					product: products,
					primaryImage: productImages.url,
				})
				.from(cartItems)
				.leftJoin(products, eq(cartItems.productId, products.id))
				.leftJoin(
					productImages,
					and(
						eq(productImages.productId, products.id),
						eq(productImages.isPrimary, true)
					)
				)
				.where(eq(cartItems.userId, userId));

			return cartData.map(({ cartItem, product, primaryImage }) => {
				if (!product) {
					// Remove invalid cart items
					db.delete(cartItems).where(eq(cartItems.id, cartItem.id));
					return null;
				}

				const subtotal = Number(product.price) * cartItem.quantity;

				return {
					id: cartItem.id,
					productId: cartItem.productId,
					quantity: cartItem.quantity,
					createdAt: cartItem.createdAt,
					updatedAt: cartItem.updatedAt,
					product: {
						id: product.id,
						name: product.name,
						price: Number(product.price),
						originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
						image: primaryImage || "/placeholder-product.jpg",
						stock: product.stock,
						categoryId: product.categoryId,
					},
					subtotal,
				};
			}).filter(Boolean); // Remove null entries
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch cart items",
				cause: error,
			});
		}
	}),

	// Get cart summary
	getSummary: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.session.user.id;

			const cartData = await db
				.select({
					quantity: cartItems.quantity,
					price: products.price,
					originalPrice: products.originalPrice,
				})
				.from(cartItems)
				.leftJoin(products, eq(cartItems.productId, products.id))
				.where(eq(cartItems.userId, userId));

			let itemCount = 0;
			let subtotal = 0;
			let savings = 0;

			for (const item of cartData) {
				if (item.price) {
					itemCount += item.quantity;
					const itemSubtotal = Number(item.price) * item.quantity;
					subtotal += itemSubtotal;

					if (item.originalPrice) {
						const originalItemTotal = Number(item.originalPrice) * item.quantity;
						savings += originalItemTotal - itemSubtotal;
					}
				}
			}

			return {
				itemCount,
				subtotal: subtotal.toFixed(2),
				savings: savings.toFixed(2),
			};
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch cart summary",
				cause: error,
			});
		}
	}),

	// Add item to cart
	addItem: protectedProcedure
		.input(
			z.object({
				productId: z.string(),
				quantity: z.number().min(1).default(1),
			}),
		)
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

				// Check stock
				if (product.trackQuantity && product.stock < input.quantity) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Insufficient stock",
					});
				}

				// Check if item already exists in cart
				const existingItem = await db.query.cartItems.findFirst({
					where: and(
						eq(cartItems.userId, userId),
						eq(cartItems.productId, input.productId)
					),
				});

				if (existingItem) {
					// Update quantity
					const newQuantity = existingItem.quantity + input.quantity;

					if (product.trackQuantity && product.stock < newQuantity) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Insufficient stock for requested quantity",
						});
					}

					const [updated] = await db
						.update(cartItems)
						.set({ 
							quantity: newQuantity,
							updatedAt: new Date()
						})
						.where(eq(cartItems.id, existingItem.id))
						.returning();

					return updated;
				} else {
					// Add new item
					const [newItem] = await db
						.insert(cartItems)
						.values({
							userId,
							productId: input.productId,
							quantity: input.quantity,
						})
						.returning();

					return newItem;
				}
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
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
				itemId: z.string(),
				quantity: z.number().min(1),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			try {
				const userId = ctx.session.user.id;

				// Get cart item and verify ownership
				const cartItem = await db.query.cartItems.findFirst({
					where: and(eq(cartItems.id, input.itemId), eq(cartItems.userId, userId)),
					with: {
						product: true,
					},
				});

				if (!cartItem) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Cart item not found",
					});
				}

				// Check stock
				if (cartItem.product.trackQuantity && cartItem.product.stock < input.quantity) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Insufficient stock",
					});
				}

				const [updated] = await db
					.update(cartItems)
					.set({ 
						quantity: input.quantity,
						updatedAt: new Date()
					})
					.where(eq(cartItems.id, input.itemId))
					.returning();

				return updated;
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update cart item",
					cause: error,
				});
			}
		}),

	// Remove item from cart
	removeItem: protectedProcedure
		.input(z.object({ itemId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			try {
				const userId = ctx.session.user.id;

				// Verify ownership and delete
				const [deleted] = await db
					.delete(cartItems)
					.where(and(eq(cartItems.id, input.itemId), eq(cartItems.userId, userId)))
					.returning();

				if (!deleted) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Cart item not found",
					});
				}

				return deleted;
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
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
			const userId = ctx.session.user.id;

			await db.delete(cartItems).where(eq(cartItems.userId, userId));

			return { success: true };
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to clear cart",
				cause: error,
			});
		}
	}),
});