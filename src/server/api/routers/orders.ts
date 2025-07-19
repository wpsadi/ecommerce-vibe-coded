import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq, desc, and, sql } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import {
    orders,
    orderItems,
    orderStatusHistory,
    products,
    users,
    type NewOrder,
    type NewOrderItem,
    type NewOrderStatusHistory
} from "@/server/db/schema"

const addressSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    company: z.string().optional(),
    phone: z.string().optional(),
    addressLine1: z.string().min(1, "Address is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
})

const createOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.string().min(1),
        quantity: z.number().min(1),
        unitPrice: z.string().regex(/^\d+\.?\d{0,2}$/, "Invalid price format"),
    })).min(1, "At least one item is required"),
    paymentMethod: z.enum(["cod", "card", "upi", "wallet"]),
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),
    customerNotes: z.string().optional(),
})

export const ordersRouter = createTRPCRouter({
    // Get user's orders
    getMyOrders: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).max(50).optional(),
            offset: z.number().min(0).optional(),
            status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"]).optional(),
        }))
        .query(async ({ input, ctx }) => {
            try {
                const { limit = 10, offset = 0, status } = input

                let whereCondition = eq(orders.userId, ctx.session.user.id)

                if (status) {
                    whereCondition = and(
                        eq(orders.userId, ctx.session.user.id),
                        eq(orders.status, status)
                    ) ?? eq(orders.userId, ctx.session.user.id)
                }

                return await ctx.db
                    .select({
                        id: orders.id,
                        orderNumber: orders.orderNumber,
                        status: orders.status,
                        paymentStatus: orders.paymentStatus,
                        paymentMethod: orders.paymentMethod,
                        subtotal: orders.subtotal,
                        taxAmount: orders.taxAmount,
                        shippingAmount: orders.shippingAmount,
                        discountAmount: orders.discountAmount,
                        totalAmount: orders.totalAmount,
                        shippingAddress: orders.shippingAddress,
                        trackingNumber: orders.trackingNumber,
                        estimatedDelivery: orders.estimatedDelivery,
                        deliveredAt: orders.deliveredAt,
                        createdAt: orders.createdAt,
                        updatedAt: orders.updatedAt,
                    })
                    .from(orders)
                    .where(whereCondition)
                    .orderBy(desc(orders.createdAt))
                    .limit(limit)
                    .offset(offset)
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch orders",
                    cause: error,
                })
            }
        }),

    // Get order by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
            try {
                const order = await ctx.db
                    .select()
                    .from(orders)
                    .where(and(
                        eq(orders.id, input.id),
                        eq(orders.userId, ctx.session.user.id)
                    ))
                    .limit(1)

                if (!order[0]) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Order not found",
                    })
                }

                // Get order items
                const items = await ctx.db
                    .select({
                        id: orderItems.id,
                        productId: orderItems.productId,
                        productName: orderItems.productName,
                        productSku: orderItems.productSku,
                        productImage: orderItems.productImage,
                        quantity: orderItems.quantity,
                        unitPrice: orderItems.unitPrice,
                        totalPrice: orderItems.totalPrice,
                    })
                    .from(orderItems)
                    .where(eq(orderItems.orderId, input.id))

                // Get status history
                const statusHistory = await ctx.db
                    .select({
                        id: orderStatusHistory.id,
                        status: orderStatusHistory.status,
                        comment: orderStatusHistory.comment,
                        notifyCustomer: orderStatusHistory.notifyCustomer,
                        createdAt: orderStatusHistory.createdAt,
                        createdBy: {
                            id: users.id,
                            name: users.name,
                        },
                    })
                    .from(orderStatusHistory)
                    .leftJoin(users, eq(orderStatusHistory.createdBy, users.id))
                    .where(eq(orderStatusHistory.orderId, input.id))
                    .orderBy(desc(orderStatusHistory.createdAt))

                return {
                    ...order[0],
                    items,
                    statusHistory,
                }
            } catch (error) {
                if (error instanceof TRPCError) throw error
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch order",
                    cause: error,
                })
            }
        }),

    // Create order
    create: protectedProcedure
        .input(createOrderSchema)
        .mutation(async ({ input, ctx }) => {
            try {
                // Verify products exist and calculate totals
                const productIds = input.items.map(item => item.productId)
                const productsData = await ctx.db
                    .select({
                        id: products.id,
                        name: products.name,
                        sku: products.sku,
                        price: products.price,
                        stock: products.stock,
                        active: products.active,
                        trackQuantity: products.trackQuantity,
                    })
                    .from(products)
                    .where(sql`${products.id} = ANY(${productIds})`)

                // Validate products
                for (const item of input.items) {
                    const product = productsData.find(p => p.id === item.productId)
                    if (!product) {
                        throw new TRPCError({
                            code: "NOT_FOUND",
                            message: `Product ${item.productId} not found`,
                        })
                    }
                    if (!product.active) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: `Product ${product.name} is not available`,
                        })
                    }
                    if (product.trackQuantity && product.stock < item.quantity) {
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: `Insufficient stock for ${product.name}`,
                        })
                    }
                }

                // Calculate subtotal
                const subtotal = input.items.reduce((sum, item) => {
                    return sum + (Number.parseFloat(item.unitPrice) * item.quantity)
                }, 0)

                // Generate order number
                const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

                // Create order
                const orderData: NewOrder = {
                    orderNumber,
                    userId: ctx.session.user.id,
                    status: "pending",
                    paymentStatus: "pending",
                    paymentMethod: input.paymentMethod,
                    subtotal: subtotal.toFixed(2),
                    taxAmount: "0.00", // Calculate tax as needed
                    shippingAmount: "0.00", // Calculate shipping as needed
                    discountAmount: "0.00",
                    totalAmount: subtotal.toFixed(2),
                    shippingAddress: input.shippingAddress,
                    billingAddress: input.billingAddress || input.shippingAddress,
                    customerNotes: input.customerNotes,
                }

                const newOrder = await ctx.db.insert(orders).values(orderData).returning()
                const firstOrder = newOrder[0]
                if (!firstOrder) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to create order",
                    })
                }
                const orderId = firstOrder.id

                // Create order items
                const orderItemsData: NewOrderItem[] = input.items.map(item => {
                    const product = productsData.find(p => p.id === item.productId)
                    if (!product) {
                        throw new TRPCError({
                            code: "NOT_FOUND",
                            message: `Product ${item.productId} not found`,
                        })
                    }
                    return {
                        orderId,
                        productId: item.productId,
                        productName: product.name,
                        productSku: product.sku,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: (Number.parseFloat(item.unitPrice) * item.quantity).toFixed(2),
                    }
                })

                await ctx.db.insert(orderItems).values(orderItemsData)

                // Create initial status history
                const statusHistoryData: NewOrderStatusHistory = {
                    orderId,
                    status: "pending",
                    comment: "Order created",
                    notifyCustomer: true,
                    createdBy: ctx.session.user.id,
                }

                await ctx.db.insert(orderStatusHistory).values(statusHistoryData)

                // Update product stock
                for (const item of input.items) {
                    const product = productsData.find(p => p.id === item.productId)
                    if (product?.trackQuantity) {
                        await ctx.db
                            .update(products)
                            .set({
                                stock: sql`${products.stock} - ${item.quantity}`,
                                updatedAt: new Date(),
                            })
                            .where(eq(products.id, item.productId))
                    }
                }

                return firstOrder
            } catch (error) {
                if (error instanceof TRPCError) throw error
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create order",
                    cause: error,
                })
            }
        }),

    // Cancel order
    cancel: protectedProcedure
        .input(z.object({
            id: z.string().min(1),
            reason: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                // Verify order belongs to user and can be cancelled
                const order = await ctx.db
                    .select({
                        id: orders.id,
                        status: orders.status,
                        userId: orders.userId,
                    })
                    .from(orders)
                    .where(eq(orders.id, input.id))
                    .limit(1)

                if (!order[0] || order[0].userId !== ctx.session.user.id) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Order not found",
                    })
                }

                if (!["pending", "confirmed"].includes(order[0].status)) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Order cannot be cancelled",
                    })
                }

                // Update order status
                await ctx.db
                    .update(orders)
                    .set({
                        status: "cancelled",
                        updatedAt: new Date(),
                    })
                    .where(eq(orders.id, input.id))

                // Add status history
                const statusHistoryData: NewOrderStatusHistory = {
                    orderId: input.id,
                    status: "cancelled",
                    comment: input.reason || "Cancelled by customer",
                    notifyCustomer: true,
                    createdBy: ctx.session.user.id,
                }

                await ctx.db.insert(orderStatusHistory).values(statusHistoryData)

                // Restore product stock
                const items = await ctx.db
                    .select({
                        productId: orderItems.productId,
                        quantity: orderItems.quantity,
                    })
                    .from(orderItems)
                    .where(eq(orderItems.orderId, input.id))

                for (const item of items) {
                    await ctx.db
                        .update(products)
                        .set({
                            stock: sql`${products.stock} + ${item.quantity}`,
                            updatedAt: new Date(),
                        })
                        .where(eq(products.id, item.productId))
                }

                return { success: true }
            } catch (error) {
                if (error instanceof TRPCError) throw error
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to cancel order",
                    cause: error,
                })
            }
        }),

    // Get order statistics (admin only)
    getStats: protectedProcedure
        .query(async ({ ctx }) => {
            // Check if user is admin
            if (ctx.session.user.role !== "admin") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Admin access required",
                })
            }

            try {
                const stats = await ctx.db
                    .select({
                        status: orders.status,
                        count: sql<number>`COUNT(*)::int`,
                        total: sql<number>`SUM(CAST(${orders.totalAmount} AS DECIMAL))`,
                    })
                    .from(orders)
                    .groupBy(orders.status)

                const totalOrders = stats.reduce((sum, stat) => sum + stat.count, 0)
                const totalRevenue = stats.reduce((sum, stat) => sum + (stat.total || 0), 0)

                return {
                    totalOrders,
                    totalRevenue: totalRevenue.toFixed(2),
                    statusBreakdown: stats,
                }
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch order statistics",
                    cause: error,
                })
            }
        }),
})
