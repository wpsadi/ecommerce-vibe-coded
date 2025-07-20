import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { mockProducts } from "@/lib/mock-data";

// Mock cart storage (in a real app, this would be in session/database)
// Using Map for better performance and to simulate database behavior
const mockCartStorage = new Map<string, Array<{
	id: string;
	userId: string;
	productId: string;
	quantity: number;
	createdAt: Date;
	updatedAt: Date;
}>>();

// Helper function to get user's cart
function getUserCart(userId: string = "anonymous") {
	if (!mockCartStorage.has(userId)) {
		mockCartStorage.set(userId, []);
	}
	return mockCartStorage.get(userId)!;
}

// Helper function to find product details
function getProductDetails(productId: string) {
	return mockProducts.find(p => p.id === productId);
}

export const cartRouter = createTRPCRouter({
	// Get user's cart items with product details
	getItems: publicProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.session?.user?.id || "anonymous";
			const cartItems = getUserCart(userId);
			
			// Enrich cart items with product details
			const enrichedItems = cartItems.map(item => {
				const product = getProductDetails(item.productId);
				if (!product) {
					return null; // Product not found, will be filtered out
				}
				
				return {
					id: item.id,
					productId: item.productId,
					quantity: item.quantity,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
					product: {
						id: product.id,
						name: product.name,
						price: product.price,
						originalPrice: product.originalPrice,
						image: product.image,
						stock: product.stock,
						categoryId: product.categoryId,
					},
					subtotal: product.price * item.quantity,
				};
			}).filter(Boolean); // Remove null items (products not found)
			
			return enrichedItems;
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch cart items",
				cause: error,
			});
		}
	}),

	// Get cart summary
	getSummary: publicProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.session?.user?.id || "anonymous";
			const cartItems = getUserCart(userId);
			
			let itemCount = 0;
			let subtotal = 0;
			
			cartItems.forEach(item => {
				const product = getProductDetails(item.productId);
				if (product) {
					itemCount += item.quantity;
					subtotal += product.price * item.quantity;
				}
			});
			
			return {
				itemCount,
				subtotal: subtotal.toString(),
				savings: "0", // Could calculate based on originalPrice vs price
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
	addItem: publicProcedure
		.input(z.object({
			productId: z.string(),
			quantity: z.number().min(1).max(99),
		}))
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id || "anonymous";
				const cart = getUserCart(userId);
				
				// Check if product exists
				const product = getProductDetails(input.productId);
				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Product not found",
					});
				}
				
				// Check stock availability
				if (product.stock < input.quantity) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Only ${product.stock} items available in stock`,
					});
				}
				
				// Check if item already exists in cart
				const existingItemIndex = cart.findIndex(item => item.productId === input.productId);
				
				if (existingItemIndex >= 0) {
					// Update existing item
					const existingItem = cart[existingItemIndex];
					const newQuantity = existingItem.quantity + input.quantity;
					
					// Check stock for new quantity
					if (product.stock < newQuantity) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Only ${product.stock} items available in stock. You already have ${existingItem.quantity} in cart.`,
						});
					}
					
					cart[existingItemIndex] = {
						...existingItem,
						quantity: newQuantity,
						updatedAt: new Date(),
					};
				} else {
					// Add new item
					cart.push({
						id: crypto.randomUUID(),
						userId,
						productId: input.productId,
						quantity: input.quantity,
						createdAt: new Date(),
						updatedAt: new Date(),
					});
				}
				
				return { success: true, message: "Item added to cart" };
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to add item to cart",
					cause: error,
				});
			}
		}),

	// Remove item from cart
	removeItem: publicProcedure
		.input(z.object({ itemId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id || "anonymous";
				const cart = getUserCart(userId);
				
				const itemIndex = cart.findIndex(item => item.id === input.itemId);
				if (itemIndex === -1) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Cart item not found",
					});
				}
				
				cart.splice(itemIndex, 1);
				return { success: true, message: "Item removed from cart" };
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to remove item from cart",
					cause: error,
				});
			}
		}),

	// Update quantity
	updateQuantity: publicProcedure
		.input(z.object({
			itemId: z.string(),
			quantity: z.number().min(1).max(99),
		}))
		.mutation(async ({ ctx, input }) => {
			try {
				const userId = ctx.session?.user?.id || "anonymous";
				const cart = getUserCart(userId);
				
				const itemIndex = cart.findIndex(item => item.id === input.itemId);
				if (itemIndex === -1) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Cart item not found",
					});
				}
				
				const item = cart[itemIndex];
				const product = getProductDetails(item.productId);
				
				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Product not found",
					});
				}
				
				// Check stock availability
				if (product.stock < input.quantity) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Only ${product.stock} items available in stock`,
					});
				}
				
				cart[itemIndex] = {
					...item,
					quantity: input.quantity,
					updatedAt: new Date(),
				};
				
				return { success: true, message: "Cart updated" };
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update cart item",
					cause: error,
				});
			}
		}),

	// Clear cart
	clearCart: publicProcedure.mutation(async ({ ctx }) => {
		try {
			const userId = ctx.session?.user?.id || "anonymous";
			mockCartStorage.set(userId, []);
			return { success: true, message: "Cart cleared" };
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to clear cart",
				cause: error,
			});
		}
	}),
});
