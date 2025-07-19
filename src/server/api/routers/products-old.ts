import { mockProducts, categories } from "@/lib/mock-data";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const productFilterSchema = z.object({
	categoryId: z.string().optional(),
	featured: z.boolean().optional(),
	active: z.boolean().optional(),
	search: z.string().optional(),
	sortBy: z.enum(["name", "price", "created_at", "rating"]).optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	limit: z.number().min(1).max(100).optional(),
	offset: z.number().min(0).optional(),
});

export const productsRouter = createTRPCRouter({
	// Get all products with filters and pagination
	getAll: publicProcedure
		.input(productFilterSchema)
		.query(async ({ input }) => {
			try {
				let products = [...mockProducts];

				// Apply filters
				if (input.categoryId) {
					products = products.filter(p => p.categoryId === input.categoryId);
				}
				
				if (input.featured !== undefined) {
					products = products.filter(p => p.featured === input.featured);
				}

				if (input.search) {
					const searchLower = input.search.toLowerCase();
					products = products.filter(p => 
						p.name.toLowerCase().includes(searchLower) ||
						p.description.toLowerCase().includes(searchLower)
					);
				}

				// Apply sorting
				if (input.sortBy) {
					products.sort((a, b) => {
						let aValue: any, bValue: any;
						
						switch (input.sortBy) {
							case "name":
								aValue = a.name.toLowerCase();
								bValue = b.name.toLowerCase();
								break;
							case "price":
								aValue = a.price;
								bValue = b.price;
								break;
							case "rating":
								aValue = a.rating;
								bValue = b.rating;
								break;
							default:
								aValue = a.id;
								bValue = b.id;
								break;
						}

						if (input.sortOrder === "asc") {
							return aValue > bValue ? 1 : -1;
						}
						return aValue < bValue ? 1 : -1;
					});
				}

				// Apply pagination
				const offset = input.offset || 0;
				const limit = input.limit || 24;
				products = products.slice(offset, offset + limit);

				// Transform to expected format
				return products.map(product => ({
					id: product.id,
					name: product.name,
					slug: product.id, // Use id as slug for mock
					description: product.description,
					price: product.price.toString(),
					originalPrice: product.originalPrice?.toString(),
					categoryId: product.categoryId,
					stock: product.stock,
					featured: product.featured || false,
					active: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					images: product.images?.map((url, index) => ({
						id: `${product.id}-img-${index}`,
						url,
						altText: `${product.name} view ${index + 1}`,
						sortOrder: index,
						isPrimary: index === 0,
					})) || [{
						id: `${product.id}-img-0`,
						url: product.image,
						altText: product.name,
						sortOrder: 0,
						isPrimary: true,
					}],
					primaryImage: product.image,
					averageRating: product.rating,
					reviewCount: product.reviews,
				}));
			} catch (error) {
				console.error("Products getAll error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch products",
					cause: error,
				});
			}
		}),

	// Get product by ID
	getById: publicProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ input }) => {
			try {
				const product = mockProducts.find(p => p.id === input.id);
				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Product not found",
					});
				}

				return {
					id: product.id,
					name: product.name,
					slug: product.id,
					description: product.description,
					price: product.price.toString(),
					originalPrice: product.originalPrice?.toString(),
					categoryId: product.categoryId,
					stock: product.stock,
					featured: product.featured || false,
					active: true,
					specifications: product.specifications,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch product",
					cause: error,
				});
			}
		}),

	// Get product images
	getImages: publicProcedure
		.input(z.object({ productId: z.string().min(1) }))
		.query(async ({ input }) => {
			try {
				const product = mockProducts.find(p => p.id === input.productId);
				if (!product) {
					return [];
				}

				return product.images?.map((url, index) => ({
					id: `${product.id}-img-${index}`,
					url,
					altText: `${product.name} view ${index + 1}`,
					sortOrder: index,
					isPrimary: index === 0,
				})) || [{
					id: `${product.id}-img-0`,
					url: product.image,
					altText: product.name,
					sortOrder: 0,
					isPrimary: true,
				}];
			} catch (error) {
				console.error("Product images error:", error);
				return [];
			}
		}),

	// Get product reviews (mock)
	getReviews: publicProcedure
		.input(z.object({ 
			productId: z.string().min(1),
			approved: z.boolean().optional(),
			limit: z.number().optional(),
			offset: z.number().optional(),
		}))
		.query(async ({ input }) => {
			try {
				const product = mockProducts.find(p => p.id === input.productId);
				if (!product) {
					return [];
				}

				// Mock reviews
				return Array.from({ length: Math.min(5, product.reviews) }, (_, i) => ({
					id: `review-${product.id}-${i}`,
					rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
					comment: `Great product! Review ${i + 1}`,
					approved: true,
					createdAt: new Date(),
					user: {
						name: `User ${i + 1}`,
					},
				}));
			} catch (error) {
				console.error("Product reviews error:", error);
				return [];
			}
		}),
});

	// Get product by slug
	getBySlug: publicProcedure
		.input(z.object({ slug: z.string().min(1) }))
		.query(async ({ input }) => {
			try {
				const product = await productService.getProductBySlug(input.slug);
				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Product not found",
					});
				}
				return product;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch product",
					cause: error,
				});
			}
		}),

	// Get product images
	getImages: publicProcedure
		.input(z.object({ productId: z.string().min(1) }))
		.query(async ({ input }) => {
			try {
				return await productService.getProductImages(input.productId);
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch product images",
					cause: error,
				});
			}
		}),

	// Get product reviews
	getReviews: publicProcedure
		.input(
			z.object({
				productId: z.string().min(1),
				approved: z.boolean().optional(),
				limit: z.number().min(1).max(100).optional(),
				offset: z.number().min(0).optional(),
			}),
		)
		.query(async ({ input }) => {
			try {
				return await productService.getProductReviews(input.productId, {
					approved: input.approved,
					limit: input.limit,
					offset: input.offset,
				});
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch product reviews",
					cause: error,
				});
			}
		}),

	// Get low stock products (admin only)
	getLowStock: protectedProcedure
		.input(z.object({ threshold: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			try {
				return await productService.getLowStockProducts(input.threshold);
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch low stock products",
					cause: error,
				});
			}
		}),

	// Create product (admin only)
	create: protectedProcedure
		.input(createProductSchema)
		.mutation(async ({ input, ctx }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			try {
				return await productService.createProduct(input);
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create product",
					cause: error,
				});
			}
		}),

	// Update product (admin only)
	update: protectedProcedure
		.input(updateProductSchema)
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
				const product = await productService.updateProduct(id, updateData);
				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Product not found",
					});
				}
				return product;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update product",
					cause: error,
				});
			}
		}),

	// Delete product (admin only)
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
				const product = await productService.deleteProduct(input.id);
				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Product not found",
					});
				}
				return product;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete product",
					cause: error,
				});
			}
		}),

	// Update product stock
	updateStock: protectedProcedure
		.input(
			z.object({
				id: z.string().min(1),
				quantity: z.number(),
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
				const product = await productService.updateProductStock(
					input.id,
					input.quantity,
				);
				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Product not found",
					});
				}
				return product;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update product stock",
					cause: error,
				});
			}
		}),

	// Assign products to category (admin only)
	assignToCategory: protectedProcedure
		.input(
			z.object({
				productIds: z.array(z.string().min(1)),
				categoryId: z.string().min(1),
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
				return await productService.assignProductsToCategory(
					input.productIds,
					input.categoryId,
				);
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to assign products to category",
					cause: error,
				});
			}
		}),
});
