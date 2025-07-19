import { relations, sql } from "drizzle-orm";
import {
	index,
	numeric,
	pgTableCreator,
	primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

/**
 * Multi-project schema for e-commerce platform
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `ecommerce_${name}`);

// ============================================================================
// AUTH TABLES (NextAuth.js integration)
// ============================================================================

export const users = createTable(
	"user",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: d.varchar({ length: 255 }),
		email: d.varchar({ length: 255 }).notNull().unique(),
		emailVerified: d
			.timestamp({
				mode: "date",
				withTimezone: true,
			})
			.default(sql`CURRENT_TIMESTAMP`),
		image: d.varchar({ length: 255 }),
		password: d.varchar({ length: 255 }),
		phone: d.varchar({ length: 20 }),
		role: d.varchar({ length: 50 }).notNull().default("user"), // user, admin
		blocked: d.boolean().notNull().default(false),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("user_email_idx").on(t.email),
		index("user_role_idx").on(t.role),
	],
);

export const accounts = createTable(
	"account",
	(d) => ({
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
		provider: d.varchar({ length: 255 }).notNull(),
		providerAccountId: d.varchar({ length: 255 }).notNull(),
		refresh_token: d.text(),
		access_token: d.text(),
		expires_at: d.integer(),
		token_type: d.varchar({ length: 255 }),
		scope: d.varchar({ length: 255 }),
		id_token: d.text(),
		session_state: d.varchar({ length: 255 }),
	}),
	(t) => [
		primaryKey({ columns: [t.provider, t.providerAccountId] }),
		index("account_user_id_idx").on(t.userId),
	],
);

export const sessions = createTable(
	"session",
	(d) => ({
		sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [index("session_user_id_idx").on(t.userId)],
);

export const verificationTokens = createTable(
	"verification_token",
	(d) => ({
		identifier: d.varchar({ length: 255 }).notNull(),
		token: d.varchar({ length: 255 }).notNull(),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ============================================================================
// CATEGORY TABLES
// ============================================================================

export const categories = createTable(
	"category",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: d.varchar({ length: 255 }).notNull(),
		slug: d.varchar({ length: 255 }).notNull().unique(),
		description: d.text(),
		icon: d.varchar({ length: 10 }), // emoji icon
		image: d.varchar({ length: 500 }), // category image URL
		featured: d.boolean().notNull().default(false),
		active: d.boolean().notNull().default(true),
		sortOrder: d.integer().notNull().default(0),
		metaTitle: d.varchar({ length: 255 }),
		metaDescription: d.text(),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("category_slug_idx").on(t.slug),
		index("category_featured_idx").on(t.featured),
		index("category_active_idx").on(t.active),
		index("category_sort_order_idx").on(t.sortOrder),
	],
);

// ============================================================================
// PRODUCT TABLES
// ============================================================================

export const products = createTable(
	"product",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: d.varchar({ length: 255 }).notNull(),
		slug: d.varchar({ length: 255 }).notNull().unique(),
		description: d.text().notNull(),
		shortDescription: d.varchar({ length: 500 }),
		sku: d.varchar({ length: 100 }).unique(),
		price: d.numeric({ precision: 10, scale: 2 }).notNull(),
		originalPrice: d.numeric({ precision: 10, scale: 2 }),
		costPrice: d.numeric({ precision: 10, scale: 2 }),
		categoryId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => categories.id, { onDelete: "restrict" }),
		stock: d.integer().notNull().default(0),
		lowStockThreshold: d.integer().notNull().default(10),
		weight: d.numeric({ precision: 8, scale: 2 }),
		dimensions: d.jsonb().$type<{
			length?: number;
			width?: number;
			height?: number;
			unit?: string;
		}>(),
		specifications: d
			.jsonb()
			.$type<Record<string, string>>()
			.notNull()
			.default({}),
		tags: d.jsonb().$type<string[]>().notNull().default([]),
		featured: d.boolean().notNull().default(false),
		active: d.boolean().notNull().default(true),
		digital: d.boolean().notNull().default(false),
		trackQuantity: d.boolean().notNull().default(true),
		allowBackorder: d.boolean().notNull().default(false),
		metaTitle: d.varchar({ length: 255 }),
		metaDescription: d.text(),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("product_slug_idx").on(t.slug),
		index("product_category_idx").on(t.categoryId),
		index("product_sku_idx").on(t.sku),
		index("product_price_idx").on(t.price),
		index("product_stock_idx").on(t.stock),
		index("product_featured_idx").on(t.featured),
		index("product_active_idx").on(t.active),
		index("product_created_at_idx").on(t.createdAt),
	],
);

export const productImages = createTable(
	"product_image",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		productId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		url: d.varchar({ length: 500 }).notNull(),
		altText: d.varchar({ length: 255 }),
		sortOrder: d.integer().notNull().default(0),
		isPrimary: d.boolean().notNull().default(false),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	}),
	(t) => [
		index("product_image_product_idx").on(t.productId),
		index("product_image_sort_order_idx").on(t.sortOrder),
		index("product_image_primary_idx").on(t.isPrimary),
	],
);

export const productReviews = createTable(
	"product_review",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		productId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		orderId: d
			.varchar({ length: 255 })
			.references(() => orders.id, { onDelete: "set null" }),
		rating: d.integer().notNull(), // 1-5
		title: d.varchar({ length: 255 }),
		comment: d.text(),
		verified: d.boolean().notNull().default(false), // verified purchase
		helpful: d.integer().notNull().default(0), // helpful votes
		reported: d.boolean().notNull().default(false),
		approved: d.boolean().notNull().default(true),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("product_review_product_idx").on(t.productId),
		index("product_review_user_idx").on(t.userId),
		index("product_review_rating_idx").on(t.rating),
		index("product_review_verified_idx").on(t.verified),
		index("product_review_approved_idx").on(t.approved),
	],
);

// ============================================================================
// CART & WISHLIST TABLES
// ============================================================================

export const cartItems = createTable(
	"cart_item",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		productId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		quantity: d.integer().notNull().default(1),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("cart_item_user_idx").on(t.userId),
		index("cart_item_product_idx").on(t.productId),
		// Unique constraint to prevent duplicate cart items
		index("cart_item_user_product_unique").on(t.userId, t.productId),
	],
);

export const wishlistItems = createTable(
	"wishlist_item",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		productId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	}),
	(t) => [
		index("wishlist_item_user_idx").on(t.userId),
		index("wishlist_item_product_idx").on(t.productId),
		// Unique constraint to prevent duplicate wishlist items
		index("wishlist_item_user_product_unique").on(t.userId, t.productId),
	],
);

// ============================================================================
// ADDRESS TABLES
// ============================================================================

export const addresses = createTable(
	"address",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: d.varchar({ length: 50 }).notNull().default("shipping"), // shipping, billing
		firstName: d.varchar({ length: 255 }).notNull(),
		lastName: d.varchar({ length: 255 }).notNull(),
		company: d.varchar({ length: 255 }),
		phone: d.varchar({ length: 20 }),
		addressLine1: d.varchar({ length: 255 }).notNull(),
		addressLine2: d.varchar({ length: 255 }),
		city: d.varchar({ length: 255 }).notNull(),
		state: d.varchar({ length: 255 }).notNull(),
		postalCode: d.varchar({ length: 20 }).notNull(),
		country: d.varchar({ length: 255 }).notNull().default("India"),
		isDefault: d.boolean().notNull().default(false),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("address_user_idx").on(t.userId),
		index("address_type_idx").on(t.type),
		index("address_default_idx").on(t.isDefault),
	],
);

// ============================================================================
// ORDER TABLES
// ============================================================================

export const orders = createTable(
	"order",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		orderNumber: d.varchar({ length: 50 }).notNull().unique(),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "restrict" }),
		status: d.varchar({ length: 50 }).notNull().default("pending"), // pending, confirmed, shipped, delivered, cancelled, refunded
		paymentStatus: d.varchar({ length: 50 }).notNull().default("pending"), // pending, paid, failed, refunded
		paymentMethod: d.varchar({ length: 50 }).notNull(), // cod, card, upi, wallet
		paymentId: d.varchar({ length: 255 }), // external payment gateway ID

		// Pricing
		subtotal: d.numeric({ precision: 10, scale: 2 }).notNull(),
		taxAmount: d.numeric({ precision: 10, scale: 2 }).notNull().default("0"),
		shippingAmount: d
			.numeric({ precision: 10, scale: 2 })
			.notNull()
			.default("0"),
		discountAmount: d
			.numeric({ precision: 10, scale: 2 })
			.notNull()
			.default("0"),
		totalAmount: d.numeric({ precision: 10, scale: 2 }).notNull(),

		// Addresses (denormalized for historical record)
		shippingAddress: d
			.jsonb()
			.$type<{
				firstName: string;
				lastName: string;
				company?: string;
				phone?: string;
				addressLine1: string;
				addressLine2?: string;
				city: string;
				state: string;
				postalCode: string;
				country: string;
			}>()
			.notNull(),

		billingAddress: d.jsonb().$type<{
			firstName: string;
			lastName: string;
			company?: string;
			phone?: string;
			addressLine1: string;
			addressLine2?: string;
			city: string;
			state: string;
			postalCode: string;
			country: string;
		}>(),

		// Tracking
		trackingNumber: d.varchar({ length: 255 }),
		estimatedDelivery: d.timestamp({ withTimezone: true }),
		deliveredAt: d.timestamp({ withTimezone: true }),

		// Notes
		customerNotes: d.text(),
		adminNotes: d.text(),

		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("order_number_idx").on(t.orderNumber),
		index("order_user_idx").on(t.userId),
		index("order_status_idx").on(t.status),
		index("order_payment_status_idx").on(t.paymentStatus),
		index("order_created_at_idx").on(t.createdAt),
	],
);

export const orderItems = createTable(
	"order_item",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		orderId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		productId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => products.id, { onDelete: "restrict" }),

		// Product snapshot (for historical record)
		productName: d.varchar({ length: 255 }).notNull(),
		productSku: d.varchar({ length: 100 }),
		productImage: d.varchar({ length: 500 }),

		quantity: d.integer().notNull(),
		unitPrice: d.numeric({ precision: 10, scale: 2 }).notNull(),
		totalPrice: d.numeric({ precision: 10, scale: 2 }).notNull(),

		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	}),
	(t) => [
		index("order_item_order_idx").on(t.orderId),
		index("order_item_product_idx").on(t.productId),
	],
);

export const orderStatusHistory = createTable(
	"order_status_history",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		orderId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		status: d.varchar({ length: 50 }).notNull(),
		comment: d.text(),
		notifyCustomer: d.boolean().notNull().default(false),
		createdBy: d
			.varchar({ length: 255 })
			.references(() => users.id, { onDelete: "set null" }),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	}),
	(t) => [
		index("order_status_history_order_idx").on(t.orderId),
		index("order_status_history_status_idx").on(t.status),
		index("order_status_history_created_at_idx").on(t.createdAt),
	],
);

// ============================================================================
// COUPON & DISCOUNT TABLES
// ============================================================================

export const coupons = createTable(
	"coupon",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		code: d.varchar({ length: 50 }).notNull().unique(),
		name: d.varchar({ length: 255 }).notNull(),
		description: d.text(),
		type: d.varchar({ length: 50 }).notNull(), // percentage, fixed, free_shipping
		value: d.numeric({ precision: 10, scale: 2 }).notNull(),
		minimumAmount: d.numeric({ precision: 10, scale: 2 }),
		maximumDiscount: d.numeric({ precision: 10, scale: 2 }),
		usageLimit: d.integer(),
		usageCount: d.integer().notNull().default(0),
		userUsageLimit: d.integer().notNull().default(1),
		active: d.boolean().notNull().default(true),
		startsAt: d.timestamp({ withTimezone: true }),
		expiresAt: d.timestamp({ withTimezone: true }),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("coupon_code_idx").on(t.code),
		index("coupon_active_idx").on(t.active),
		index("coupon_expires_at_idx").on(t.expiresAt),
	],
);

export const couponUsage = createTable(
	"coupon_usage",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		couponId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => coupons.id, { onDelete: "cascade" }),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		orderId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		discountAmount: d.numeric({ precision: 10, scale: 2 }).notNull(),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	}),
	(t) => [
		index("coupon_usage_coupon_idx").on(t.couponId),
		index("coupon_usage_user_idx").on(t.userId),
		index("coupon_usage_order_idx").on(t.orderId),
	],
);

// ============================================================================
// NOTIFICATION TABLES
// ============================================================================

export const notifications = createTable(
	"notification",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: d.varchar({ length: 50 }).notNull(), // order_update, product_back_in_stock, promotion, etc.
		title: d.varchar({ length: 255 }).notNull(),
		message: d.text().notNull(),
		data: d.jsonb().$type<Record<string, unknown>>(),
		read: d.boolean().notNull().default(false),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	}),
	(t) => [
		index("notification_user_idx").on(t.userId),
		index("notification_type_idx").on(t.type),
		index("notification_read_idx").on(t.read),
		index("notification_created_at_idx").on(t.createdAt),
	],
);

// ============================================================================
// ANALYTICS TABLES
// ============================================================================

export const productViews = createTable(
	"product_view",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		productId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		userId: d
			.varchar({ length: 255 })
			.references(() => users.id, { onDelete: "set null" }),
		sessionId: d.varchar({ length: 255 }),
		ipAddress: d.varchar({ length: 45 }),
		userAgent: d.text(),
		referrer: d.varchar({ length: 500 }),
		createdAt: d
			.timestamp({ withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	}),
	(t) => [
		index("product_view_product_idx").on(t.productId),
		index("product_view_user_idx").on(t.userId),
		index("product_view_session_idx").on(t.sessionId),
		index("product_view_created_at_idx").on(t.createdAt),
	],
);

// ============================================================================
// RELATIONS
// ============================================================================

// User Relations
export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	cartItems: many(cartItems),
	wishlistItems: many(wishlistItems),
	addresses: many(addresses),
	orders: many(orders),
	reviews: many(productReviews),
	notifications: many(notifications),
	couponUsages: many(couponUsage),
	productViews: many(productViews),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// Category Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
	products: many(products),
}));

// Product Relations
export const productsRelations = relations(products, ({ one, many }) => ({
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id],
	}),
	images: many(productImages),
	reviews: many(productReviews),
	cartItems: many(cartItems),
	wishlistItems: many(wishlistItems),
	orderItems: many(orderItems),
	views: many(productViews),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
	product: one(products, {
		fields: [productImages.productId],
		references: [products.id],
	}),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
	product: one(products, {
		fields: [productReviews.productId],
		references: [products.id],
	}),
	user: one(users, { fields: [productReviews.userId], references: [users.id] }),
	order: one(orders, {
		fields: [productReviews.orderId],
		references: [orders.id],
	}),
}));

// Cart & Wishlist Relations
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
	user: one(users, { fields: [cartItems.userId], references: [users.id] }),
	product: one(products, {
		fields: [cartItems.productId],
		references: [products.id],
	}),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
	user: one(users, { fields: [wishlistItems.userId], references: [users.id] }),
	product: one(products, {
		fields: [wishlistItems.productId],
		references: [products.id],
	}),
}));

// Address Relations
export const addressesRelations = relations(addresses, ({ one }) => ({
	user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

// Order Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
	user: one(users, { fields: [orders.userId], references: [users.id] }),
	items: many(orderItems),
	statusHistory: many(orderStatusHistory),
	couponUsages: many(couponUsage),
	reviews: many(productReviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id],
	}),
}));

export const orderStatusHistoryRelations = relations(
	orderStatusHistory,
	({ one }) => ({
		order: one(orders, {
			fields: [orderStatusHistory.orderId],
			references: [orders.id],
		}),
		createdBy: one(users, {
			fields: [orderStatusHistory.createdBy],
			references: [users.id],
		}),
	}),
);

// Coupon Relations
export const couponsRelations = relations(coupons, ({ many }) => ({
	usages: many(couponUsage),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
	coupon: one(coupons, {
		fields: [couponUsage.couponId],
		references: [coupons.id],
	}),
	user: one(users, { fields: [couponUsage.userId], references: [users.id] }),
	order: one(orders, {
		fields: [couponUsage.orderId],
		references: [orders.id],
	}),
}));

// Notification Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

// Analytics Relations
export const productViewsRelations = relations(productViews, ({ one }) => ({
	product: one(products, {
		fields: [productViews.productId],
		references: [products.id],
	}),
	user: one(users, { fields: [productViews.userId], references: [users.id] }),
}));

// ============================================================================
// TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert;

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;

export type CouponUsage = typeof couponUsage.$inferSelect;
export type NewCouponUsage = typeof couponUsage.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type ProductView = typeof productViews.$inferSelect;
export type NewProductView = typeof productViews.$inferInsert;
