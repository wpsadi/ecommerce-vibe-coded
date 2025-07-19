import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc"
import * as productService from "@/lib/products"

const productFilterSchema = z.object({
    categoryId: z.string().optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
    search: z.string().optional(),
    sortBy: z.enum(["name", "price", "created_at", "rating"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    limit: z.number().min(1).max(100).optional(),
    offset: z.number().min(0).optional(),
})

const createProductSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().min(1, "Description is required"),
    shortDescription: z.string().optional(),
    sku: z.string().optional(),
    price: z.string().regex(/^\d+\.?\d{0,2}$/, "Invalid price format"),
    originalPrice: z.string().regex(/^\d+\.?\d{0,2}$/, "Invalid price format").optional(),
    costPrice: z.string().regex(/^\d+\.?\d{0,2}$/, "Invalid price format").optional(),
    categoryId: z.string().min(1, "Category is required"),
    stock: z.number().min(0).optional(),
    lowStockThreshold: z.number().min(0).optional(),
    weight: z.string().optional(),
    dimensions: z.object({
        length: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        unit: z.string().optional(),
    }).optional(),
    specifications: z.record(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
    digital: z.boolean().optional(),
    trackQuantity: z.boolean().optional(),
    allowBackorder: z.boolean().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
})

const updateProductSchema = createProductSchema.partial().extend({
    id: z.string().min(1, "Product ID is required"),
})

export const productsRouter = createTRPCRouter({
    // Get all products with filters and pagination
    getAll: publicProcedure
        .input(productFilterSchema)
        .query(async ({ input }) => {
            try {
                return await productService.getAllProducts(input)
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch products",
                    cause: error,
                })
            }
        }),

    // Get product by ID
    getById: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ input }) => {
            try {
                const product = await productService.getProductById(input.id)
                if (!product) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Product not found",
                    })
                }
                return product
            } catch (error) {
                if (error instanceof TRPCError) throw error
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch product",
                    cause: error,
                })
            }
        }),

    // Get product by slug
    getBySlug: publicProcedure
        .input(z.object({ slug: z.string().min(1) }))
        .query(async ({ input }) => {
            try {
                const product = await productService.getProductBySlug(input.slug)
                if (!product) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Product not found",
                    })
                }
                return product
            } catch (error) {
                if (error instanceof TRPCError) throw error
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch product",
                    cause: error,
                })
            }
        }),

    // Get product images
    getImages: publicProcedure
        .input(z.object({ productId: z.string().min(1) }))
        .query(async ({ input }) => {
            try {
                return await productService.getProductImages(input.productId)
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch product images",
                    cause: error,
                })
            }
        }),

    // Get product reviews
    getReviews: publicProcedure
        .input(z.object({
            productId: z.string().min(1),
            approved: z.boolean().optional(),
            limit: z.number().min(1).max(100).optional(),
            offset: z.number().min(0).optional(),
        }))
        .query(async ({ input }) => {
            try {
                return await productService.getProductReviews(input.productId, {
                    approved: input.approved,
                    limit: input.limit,
                    offset: input.offset,
                })
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch product reviews",
                    cause: error,
                })
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
                })
            }

            try {
                return await productService.getLowStockProducts(input.threshold)
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch low stock products",
                    cause: error,
                })
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
                })
            }

            try {
                return await productService.createProduct(input)
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create product",
                    cause: error,
                })
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
                })
            }

            try {
                const { id, ...updateData } = input
                const product = await productService.updateProduct(id, updateData)
                if (!product) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Product not found",
                    })
                }
                return product
            } catch (error) {
                if (error instanceof TRPCError) throw error
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to update product",
                    cause: error,
                })
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
                })
            }

            try {
                const product = await productService.deleteProduct(input.id)
                if (!product) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Product not found",
                    })
                }
                return product
            } catch (error) {
                if (error instanceof TRPCError) throw error
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to delete product",
                    cause: error,
                })
            }
        }),

    // Update product stock
    updateStock: protectedProcedure
        .input(z.object({
            id: z.string().min(1),
            quantity: z.number(),
        }))
        .mutation(async ({ input, ctx }) => {
            // Check if user is admin
            if (ctx.session.user.role !== "admin") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Admin access required",
                })
            }

            try {
                const product = await productService.updateProductStock(input.id, input.quantity)
                if (!product) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Product not found",
                    })
                }
                return product
            } catch (error) {
                if (error instanceof TRPCError) throw error
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to update product stock",
                    cause: error,
                })
            }
        }),

    // Assign products to category (admin only)
    assignToCategory: protectedProcedure
        .input(z.object({
            productIds: z.array(z.string().min(1)),
            categoryId: z.string().min(1),
        }))
        .mutation(async ({ input, ctx }) => {
            // Check if user is admin
            if (ctx.session.user.role !== "admin") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Admin access required",
                })
            }

            try {
                return await productService.assignProductsToCategory(input.productIds, input.categoryId)
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to assign products to category",
                    cause: error,
                })
            }
        }),
})
