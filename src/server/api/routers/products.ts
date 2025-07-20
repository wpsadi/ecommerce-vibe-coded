import { db } from "@/server/db";
import { 
	categories, 
	products, 
	productImages, 
	productReviews 
} from "@/server/db/schema";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { 
	and, 
	avg, 
	count, 
	desc, 
	eq, 
	ilike, 
	asc,
	or,
	sql,
	lt,
	lte,
	inArray
} from "drizzle-orm";
import { mockProducts } from "@/lib/mock-data";
import { MockDatabase } from "@/lib/mock-database";

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

const createProductSchema = z.object({
	name: z.string().min(1).max(255),
	slug: z.string().min(1).max(255),
	description: z.string().min(1),
	shortDescription: z.string().max(500).optional(),
	sku: z.string().max(100).optional(),
	price: z.string().min(1), // numeric as string
	originalPrice: z.string().optional(),
	costPrice: z.string().optional(),
	categoryId: z.string().min(1),
	stock: z.number().int().min(0).default(0),
	lowStockThreshold: z.number().int().min(0).default(10),
	weight: z.string().optional(),
	dimensions: z.object({
		length: z.number().optional(),
		width: z.number().optional(),
		height: z.number().optional(),
		unit: z.string().optional(),
	}).optional(),
	specifications: z.record(z.string()).default({}),
	tags: z.array(z.string()).default([]),
	featured: z.boolean().default(false),
	active: z.boolean().default(true),
	digital: z.boolean().default(false),
	trackQuantity: z.boolean().default(true),
	allowBackorder: z.boolean().default(false),
	metaTitle: z.string().max(255).optional(),
	metaDescription: z.string().optional(),
});

const updateProductSchema = createProductSchema.partial().extend({
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
		console.warn("Database operation failed, falling back to mock data:", error);
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

export const productsRouter = createTRPCRouter({
	// Get all products with filters and pagination
	getAll: publicProcedure
		.input(productFilterSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await withDatabaseFallback(
					async () => {
						// Database operation would go here
						const whereConditions = [eq(products.active, true)];

						// Apply filters
						if (input.categoryId) {
							whereConditions.push(eq(products.categoryId, input.categoryId));
						}
						
						if (input.featured !== undefined) {
							whereConditions.push(eq(products.featured, input.featured));
						}

						if (input.search) {
							whereConditions.push(
								or(
									ilike(products.name, `%${input.search}%`),
									ilike(products.description, `%${input.search}%`),
									ilike(products.shortDescription, `%${input.search}%`)
								)
							);
						}

						// This would be the actual database query when DB is available
						throw new Error("Database not available");
					},
					() => {
						// Fallback to persistent mock data
						let filteredProducts = MockDatabase.getProducts();

						// Apply filters
						if (input.categoryId) {
							filteredProducts = filteredProducts.filter(p => p.categoryId === input.categoryId);
						}
						
						if (input.featured !== undefined) {
							filteredProducts = filteredProducts.filter(p => p.featured === input.featured);
						}

						if (input.search) {
							const searchLower = input.search.toLowerCase();
							filteredProducts = filteredProducts.filter(p => 
								p.name.toLowerCase().includes(searchLower) ||
								p.description.toLowerCase().includes(searchLower)
							);
						}

						// Apply sorting
						if (input.sortBy) {
							filteredProducts.sort((a, b) => {
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
						filteredProducts = filteredProducts.slice(offset, offset + limit);

						// Transform to expected format
						return filteredProducts.map(product => ({
							id: product.id,
							name: product.name,
							slug: product.id, // Use id as slug for mock
							description: product.description,
							shortDescription: product.description.substring(0, 100) + "...",
							sku: `SKU-${product.id}`,
							price: product.price.toString(),
							originalPrice: product.originalPrice?.toString(),
							categoryId: product.categoryId,
							stock: product.stock,
							featured: product.featured || false,
							active: true,
							specifications: product.specifications,
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
					}
				);
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
		.query(async ({ ctx, input }) => {
			try {
				return await withDatabaseFallback(
					async () => {
						const product = await ctx.db
							.select()
							.from(products)
							.where(eq(products.id, input.id))
							.limit(1);

						if (!product[0]) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Product not found",
							});
						}

						return product[0];
					},
					() => {
						const product = MockDatabase.findProductById(input.id);
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
							shortDescription: product.description.substring(0, 100) + "...",
							sku: `SKU-${product.id}`,
							price: product.price.toString(),
							originalPrice: product.originalPrice?.toString(),
							costPrice: null,
							categoryId: product.categoryId,
							stock: product.stock,
							lowStockThreshold: 10,
							weight: null,
							dimensions: null,
							specifications: product.specifications,
							tags: [],
							featured: product.featured || false,
							active: true,
							digital: false,
							trackQuantity: true,
							allowBackorder: false,
							metaTitle: null,
							metaDescription: null,
							createdAt: new Date(),
							updatedAt: new Date(),
						};
					}
				);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch product",
					cause: error,
				});
			}
		}),

	// Get product by slug
	getBySlug: publicProcedure
		.input(z.object({ slug: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			try {
				return await withDatabaseFallback(
					async () => {
						const product = await ctx.db
							.select()
							.from(products)
							.where(eq(products.slug, input.slug))
							.limit(1);

						if (!product[0]) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Product not found",
							});
						}

						return product[0];
					},
					() => {
						// For mock data, use id as slug
						const product = MockDatabase.findProductById(input.slug);
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
							shortDescription: product.description.substring(0, 100) + "...",
							sku: `SKU-${product.id}`,
							price: product.price.toString(),
							originalPrice: product.originalPrice?.toString(),
							costPrice: null,
							categoryId: product.categoryId,
							stock: product.stock,
							lowStockThreshold: 10,
							weight: null,
							dimensions: null,
							specifications: product.specifications,
							tags: [],
							featured: product.featured || false,
							active: true,
							digital: false,
							trackQuantity: true,
							allowBackorder: false,
							metaTitle: null,
							metaDescription: null,
							createdAt: new Date(),
							updatedAt: new Date(),
						};
					}
				);
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
		.query(async ({ ctx, input }) => {
			try {
				return await withDatabaseFallback(
					async () => {
						const images = await ctx.db
							.select()
							.from(productImages)
							.where(eq(productImages.productId, input.productId))
							.orderBy(productImages.sortOrder, desc(productImages.isPrimary));

						return images;
					},
					() => {
						const product = MockDatabase.findProductById(input.productId);
						if (!product) {
							return [];
						}

						return product.images?.map((url, index) => ({
							id: `${product.id}-img-${index}`,
							productId: product.id,
							url,
							altText: `${product.name} view ${index + 1}`,
							sortOrder: index,
							isPrimary: index === 0,
							createdAt: new Date(),
						})) || [{
							id: `${product.id}-img-0`,
							productId: product.id,
							url: product.image,
							altText: product.name,
							sortOrder: 0,
							isPrimary: true,
							createdAt: new Date(),
						}];
					}
				);
			} catch (error) {
				console.error("Product images error:", error);
				return [];
			}
		}),

	// Get product reviews
	getReviews: publicProcedure
		.input(z.object({ 
			productId: z.string().min(1),
			approved: z.boolean().optional(),
			limit: z.number().optional(),
			offset: z.number().optional(),
		}))
		.query(async ({ ctx, input }) => {
			try {
				return await withDatabaseFallback(
					async () => {
						// Database operation would go here
						throw new Error("Database not available");
					},
					() => {
						const product = MockDatabase.findProductById(input.productId);
						if (!product) {
							return [];
						}

						// Mock reviews
						return Array.from({ length: Math.min(5, product.reviews) }, (_, i) => ({
							id: `review-${product.id}-${i}`,
							productId: product.id,
							userId: `user-${i + 1}`,
							orderId: null,
							rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
							title: `Great product! Review ${i + 1}`,
							comment: `This is a great product. Review number ${i + 1}`,
							verified: true,
							helpful: Math.floor(Math.random() * 10),
							reported: false,
							approved: true,
							createdAt: new Date(),
							updatedAt: new Date(),
							user: {
								name: `User ${i + 1}`,
							},
						}));
					}
				);
			} catch (error) {
				console.error("Product reviews error:", error);
				return [];
			}
		}),

	// Create product (admin only)
	create: protectedProcedure
		.input(createProductSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				checkAdminPermission(ctx);
				
				return await withDatabaseFallback(
					async () => {
						// Database operation
						const processedData = {
							...input,
							price: input.price,
							originalPrice: input.originalPrice || null,
							costPrice: input.costPrice || null,
							id: crypto.randomUUID(),
						};

						const newProduct = await ctx.db
							.insert(products)
							.values(processedData)
							.returning();

						if (!newProduct[0]) {
							throw new TRPCError({
								code: "INTERNAL_SERVER_ERROR",
								message: "Failed to create product",
							});
						}

						return newProduct[0];
					},
					() => {
						// Fallback: Create using persistent mock database
						const newProduct = MockDatabase.createProduct({
							name: input.name,
							price: Number(input.price),
							originalPrice: input.originalPrice ? Number(input.originalPrice) : undefined,
							image: "/placeholder.svg",
							category: "General", // Will be updated based on categoryId
							categoryId: input.categoryId,
							rating: 0,
							reviews: 0,
							description: input.description,
							specifications: input.specifications,
							stock: input.stock,
							discount: 0,
							featured: input.featured,
						});

						return {
							id: newProduct.id,
							name: newProduct.name,
							slug: newProduct.id,
							description: newProduct.description,
							shortDescription: input.shortDescription || null,
							sku: input.sku || null,
							price: newProduct.price.toString(),
							originalPrice: newProduct.originalPrice?.toString() || null,
							costPrice: input.costPrice || null,
							categoryId: newProduct.categoryId,
							stock: newProduct.stock,
							lowStockThreshold: input.lowStockThreshold,
							weight: input.weight || null,
							dimensions: input.dimensions || null,
							specifications: newProduct.specifications,
							tags: input.tags,
							featured: newProduct.featured,
							active: input.active,
							digital: input.digital,
							trackQuantity: input.trackQuantity,
							allowBackorder: input.allowBackorder,
							metaTitle: input.metaTitle || null,
							metaDescription: input.metaDescription || null,
							createdAt: new Date(),
							updatedAt: new Date(),
						};
					}
				);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Products create error:", error);
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
		.mutation(async ({ ctx, input }) => {
			try {
				checkAdminPermission(ctx);
				
				return await withDatabaseFallback(
					async () => {
						// Database operation
						const { id, ...updateData } = input;
						
						// Convert price to numeric for database
						const processedData = {
							...updateData,
							price: updateData.price ? updateData.price : undefined,
							originalPrice: updateData.originalPrice ? updateData.originalPrice : undefined,
							costPrice: updateData.costPrice ? updateData.costPrice : undefined,
						};

						const updatedProduct = await ctx.db
							.update(products)
							.set({
								...processedData,
								updatedAt: new Date(),
							})
							.where(eq(products.id, id))
							.returning();

						if (!updatedProduct[0]) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Product not found",
							});
						}

						return updatedProduct[0];
					},
					() => {
						// Fallback: Update using persistent mock database
						const { id, ...updateData } = input;
						
						const updates: Partial<any> = {};
						if (updateData.name) updates.name = updateData.name;
						if (updateData.description) updates.description = updateData.description;
						if (updateData.price) updates.price = Number(updateData.price);
						if (updateData.originalPrice) updates.originalPrice = Number(updateData.originalPrice);
						if (updateData.categoryId) updates.categoryId = updateData.categoryId;
						if (updateData.stock !== undefined) updates.stock = updateData.stock;
						if (updateData.featured !== undefined) updates.featured = updateData.featured;
						if (updateData.specifications) updates.specifications = updateData.specifications;

						const updatedProduct = MockDatabase.updateProduct(id, updates);
						
						if (!updatedProduct) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Product not found",
							});
						}

						return {
							id: updatedProduct.id,
							name: updatedProduct.name,
							slug: updatedProduct.id,
							description: updatedProduct.description,
							price: updatedProduct.price.toString(),
							categoryId: updatedProduct.categoryId,
							stock: updatedProduct.stock,
							featured: updatedProduct.featured || false,
							active: true,
							updatedAt: new Date(),
							createdAt: new Date(),
						};
					}
				);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Products update error:", error);
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
		.mutation(async ({ ctx, input }) => {
			try {
				checkAdminPermission(ctx);

				return await withDatabaseFallback(
					async () => {
						// Database operation
						const deletedProduct = await ctx.db
							.delete(products)
							.where(eq(products.id, input.id))
							.returning();

						if (!deletedProduct[0]) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Product not found",
							});
						}

						return { success: true, deletedProduct: deletedProduct[0] };
					},
					() => {
						// Fallback: Delete using persistent mock database
						const deletedProduct = MockDatabase.deleteProduct(input.id);
						
						if (!deletedProduct) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "Product not found",
							});
						}

						return { 
							success: true, 
							deletedProduct: {
								id: deletedProduct.id,
								name: deletedProduct.name,
							}
						};
					}
				);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Products delete error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete product",
					cause: error,
				});
			}
		}),

	// Update product stock
	updateStock: protectedProcedure
		.input(z.object({ 
			id: z.string().min(1),
			stock: z.number().int().min(0),
		}))
		.mutation(async ({ ctx, input }) => {
			try {
				checkAdminPermission(ctx);

				throw new TRPCError({
					code: "NOT_IMPLEMENTED",
					message: "Stock update is not yet implemented. Database setup required.",
				});
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Products updateStock error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update stock",
					cause: error,
				});
			}
		}),

	// Get low stock products
	getLowStock: protectedProcedure
		.input(z.object({ threshold: z.number().int().min(0).optional() }))
		.query(async ({ ctx, input }) => {
			try {
				checkAdminPermission(ctx);

				throw new TRPCError({
					code: "NOT_IMPLEMENTED",
					message: "Low stock check is not yet implemented. Database setup required.",
				});
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Products getLowStock error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch low stock products",
					cause: error,
				});
			}
		}),

	// Assign products to category (admin only)
	assignToCategory: protectedProcedure
		.input(z.object({ 
			productIds: z.array(z.string().min(1)),
			categoryId: z.string().min(1),
		}))
		.mutation(async ({ ctx, input }) => {
			try {
				checkAdminPermission(ctx);

				throw new TRPCError({
					code: "NOT_IMPLEMENTED",
					message: "Product assignment is not yet implemented. Database setup required.",
				});
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Products assignToCategory error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to assign products to category",
					cause: error,
				});
			}
		}),
});