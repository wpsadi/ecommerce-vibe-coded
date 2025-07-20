import { relations, sql } from "drizzle-orm";
import {
	index,
	sqliteTableCreator,
	primaryKey,
	text,
	integer,
	real,
	blob,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccount } from "next-auth/adapters";

/**
 * Multi-project schema for e-commerce platform - SQLite version
 */
export const createTable = sqliteTableCreator((name) => `ecommerce_${name}`);

// ============================================================================
// AUTH TABLES (NextAuth.js integration)
// ============================================================================

export const users = createTable(
	"user",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		name: text("name"),
		email: text("email").notNull().unique(),
		emailVerified: integer("emailVerified", { mode: "timestamp" }),
		image: text("image"),
		password: text("password"),
		phone: text("phone"),
		role: text("role").notNull().default("user"), // user, admin
		blocked: integer("blocked", { mode: "boolean" }).notNull().default(false),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(() => new Date()),
	},
	(t) => ({
		emailIdx: index("user_email_idx").on(t.email),
		roleIdx: index("user_role_idx").on(t.role),
	}),
);

export const accounts = createTable(
	"account",
	{
		userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
		type: text("type").$type<AdapterAccount["type"]>().notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("providerAccountId").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
	},
	(t) => ({
		compositePk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
		userIdIdx: index("account_user_id_idx").on(t.userId),
	}),
);

export const sessions = createTable(
	"session",
	{
		sessionToken: text("sessionToken").notNull().primaryKey(),
		userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
		expires: integer("expires", { mode: "timestamp" }).notNull(),
	},
	(t) => ({
		userIdIdx: index("session_user_id_idx").on(t.userId),
	}),
);

export const verificationTokens = createTable(
	"verification_token",
	{
		identifier: text("identifier").notNull(),
		token: text("token").notNull(),
		expires: integer("expires", { mode: "timestamp" }).notNull(),
	},
	(t) => ({
		compositePk: primaryKey({ columns: [t.identifier, t.token] }),
	}),
);

// ============================================================================
// CATEGORY TABLES
// ============================================================================

export const categories = createTable(
	"category",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		description: text("description"),
		icon: text("icon"), // emoji icon
		image: text("image"), // category image URL
		featured: integer("featured", { mode: "boolean" }).notNull().default(false),
		active: integer("active", { mode: "boolean" }).notNull().default(true),
		sortOrder: integer("sortOrder").notNull().default(0),
		metaTitle: text("metaTitle"),
		metaDescription: text("metaDescription"),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(() => new Date()),
	},
	(t) => ({
		slugIdx: index("category_slug_idx").on(t.slug),
		featuredIdx: index("category_featured_idx").on(t.featured),
		activeIdx: index("category_active_idx").on(t.active),
		sortOrderIdx: index("category_sort_order_idx").on(t.sortOrder),
	}),
);

// ============================================================================
// PRODUCT TABLES
// ============================================================================

export const products = createTable(
	"product",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		description: text("description").notNull(),
		shortDescription: text("shortDescription"),
		sku: text("sku").unique(),
		price: text("price").notNull(), // Store as text to avoid precision issues
		originalPrice: text("originalPrice"),
		costPrice: text("costPrice"),
		categoryId: text("categoryId").notNull().references(() => categories.id, { onDelete: "restrict" }),
		stock: integer("stock").notNull().default(0),
		lowStockThreshold: integer("lowStockThreshold").notNull().default(10),
		weight: real("weight"),
		dimensions: text("dimensions", { mode: "json" }).$type<{
			length?: number;
			width?: number;
			height?: number;
			unit?: string;
		}>(),
		specifications: text("specifications", { mode: "json" }).$type<Record<string, string>>().notNull().default("{}"),
		tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default("[]"),
		featured: integer("featured", { mode: "boolean" }).notNull().default(false),
		active: integer("active", { mode: "boolean" }).notNull().default(true),
		digital: integer("digital", { mode: "boolean" }).notNull().default(false),
		trackQuantity: integer("trackQuantity", { mode: "boolean" }).notNull().default(true),
		allowBackorder: integer("allowBackorder", { mode: "boolean" }).notNull().default(false),
		metaTitle: text("metaTitle"),
		metaDescription: text("metaDescription"),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(() => new Date()),
	},
	(t) => ({
		slugIdx: index("product_slug_idx").on(t.slug),
		categoryIdx: index("product_category_idx").on(t.categoryId),
		skuIdx: index("product_sku_idx").on(t.sku),
		priceIdx: index("product_price_idx").on(t.price),
		stockIdx: index("product_stock_idx").on(t.stock),
		featuredIdx: index("product_featured_idx").on(t.featured),
		activeIdx: index("product_active_idx").on(t.active),
		createdAtIdx: index("product_created_at_idx").on(t.createdAt),
	}),
);

export const productImages = createTable(
	"product_image",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		productId: text("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
		url: text("url").notNull(),
		altText: text("altText"),
		sortOrder: integer("sortOrder").notNull().default(0),
		isPrimary: integer("isPrimary", { mode: "boolean" }).notNull().default(false),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
	},
	(t) => ({
		productIdx: index("product_image_product_idx").on(t.productId),
		sortOrderIdx: index("product_image_sort_order_idx").on(t.sortOrder),
		primaryIdx: index("product_image_primary_idx").on(t.isPrimary),
	}),
);

export const productReviews = createTable(
	"product_review",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		productId: text("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
		userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
		orderId: text("orderId").references(() => orders.id, { onDelete: "set null" }),
		rating: integer("rating").notNull(), // 1-5
		title: text("title"),
		comment: text("comment"),
		verified: integer("verified", { mode: "boolean" }).notNull().default(false),
		helpful: integer("helpful").notNull().default(0),
		reported: integer("reported", { mode: "boolean" }).notNull().default(false),
		approved: integer("approved", { mode: "boolean" }).notNull().default(true),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(() => new Date()),
	},
	(t) => ({
		productIdx: index("product_review_product_idx").on(t.productId),
		userIdx: index("product_review_user_idx").on(t.userId),
		ratingIdx: index("product_review_rating_idx").on(t.rating),
		verifiedIdx: index("product_review_verified_idx").on(t.verified),
		approvedIdx: index("product_review_approved_idx").on(t.approved),
	}),
);

// ============================================================================
// CART & WISHLIST TABLES
// ============================================================================

export const cartItems = createTable(
	"cart_item",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
		productId: text("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
		quantity: integer("quantity").notNull().default(1),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(() => new Date()),
	},
	(t) => ({
		userIdx: index("cart_item_user_idx").on(t.userId),
		productIdx: index("cart_item_product_idx").on(t.productId),
		userProductIdx: index("cart_item_user_product_unique").on(t.userId, t.productId),
	}),
);

export const wishlistItems = createTable(
	"wishlist_item",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
		productId: text("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
	},
	(t) => ({
		userIdx: index("wishlist_item_user_idx").on(t.userId),
		productIdx: index("wishlist_item_product_idx").on(t.productId),
		userProductIdx: index("wishlist_item_user_product_unique").on(t.userId, t.productId),
	}),
);

// ============================================================================
// ADDRESS TABLES
// ============================================================================

export const addresses = createTable(
	"address",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
		type: text("type").notNull().default("shipping"), // shipping, billing
		firstName: text("firstName").notNull(),
		lastName: text("lastName").notNull(),
		company: text("company"),
		phone: text("phone"),
		addressLine1: text("addressLine1").notNull(),
		addressLine2: text("addressLine2"),
		city: text("city").notNull(),
		state: text("state").notNull(),
		postalCode: text("postalCode").notNull(),
		country: text("country").notNull().default("India"),
		isDefault: integer("isDefault", { mode: "boolean" }).notNull().default(false),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(() => new Date()),
	},
	(t) => ({
		userIdx: index("address_user_idx").on(t.userId),
		typeIdx: index("address_type_idx").on(t.type),
		defaultIdx: index("address_default_idx").on(t.isDefault),
	}),
);

// ============================================================================
// ORDER TABLES
// ============================================================================

export const orders = createTable(
	"order",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		orderNumber: text("orderNumber").notNull().unique(),
		userId: text("userId").notNull().references(() => users.id, { onDelete: "restrict" }),
		status: text("status").notNull().default("pending"), // pending, confirmed, shipped, delivered, cancelled, refunded
		paymentStatus: text("paymentStatus").notNull().default("pending"), // pending, paid, failed, refunded
		paymentMethod: text("paymentMethod").notNull(), // cod, card, upi, wallet
		paymentId: text("paymentId"), // external payment gateway ID

		// Pricing
		subtotal: text("subtotal").notNull(),
		taxAmount: text("taxAmount").notNull().default("0"),
		shippingAmount: text("shippingAmount").notNull().default("0"),
		discountAmount: text("discountAmount").notNull().default("0"),
		totalAmount: text("totalAmount").notNull(),

		// Addresses (JSON stored)
		shippingAddress: text("shippingAddress", { mode: "json" }).$type<{
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
		}>().notNull(),

		billingAddress: text("billingAddress", { mode: "json" }).$type<{
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
		trackingNumber: text("trackingNumber"),
		estimatedDelivery: integer("estimatedDelivery", { mode: "timestamp" }),
		deliveredAt: integer("deliveredAt", { mode: "timestamp" }),

		// Notes
		customerNotes: text("customerNotes"),
		adminNotes: text("adminNotes"),

		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(() => new Date()),
	},
	(t) => ({
		orderNumberIdx: index("order_number_idx").on(t.orderNumber),
		userIdx: index("order_user_idx").on(t.userId),
		statusIdx: index("order_status_idx").on(t.status),
		paymentStatusIdx: index("order_payment_status_idx").on(t.paymentStatus),
		createdAtIdx: index("order_created_at_idx").on(t.createdAt),
	}),
);

export const orderItems = createTable(
	"order_item",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		orderId: text("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
		productId: text("productId").notNull().references(() => products.id, { onDelete: "restrict" }),

		// Product snapshot (for historical record)
		productName: text("productName").notNull(),
		productSku: text("productSku"),
		productImage: text("productImage"),

		quantity: integer("quantity").notNull(),
		unitPrice: text("unitPrice").notNull(),
		totalPrice: text("totalPrice").notNull(),

		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
	},
	(t) => ({
		orderIdx: index("order_item_order_idx").on(t.orderId),
		productIdx: index("order_item_product_idx").on(t.productId),
	}),
);

export const orderStatusHistory = createTable(
	"order_status_history",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		orderId: text("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
		status: text("status").notNull(),
		comment: text("comment"),
		notifyCustomer: integer("notifyCustomer", { mode: "boolean" }).notNull().default(false),
		createdBy: text("createdBy").references(() => users.id, { onDelete: "set null" }),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
	},
	(t) => ({
		orderIdx: index("order_status_history_order_idx").on(t.orderId),
		statusIdx: index("order_status_history_status_idx").on(t.status),
		createdAtIdx: index("order_status_history_created_at_idx").on(t.createdAt),
	}),
);

// ============================================================================
// COUPON & DISCOUNT TABLES
// ============================================================================

export const coupons = createTable(
	"coupon",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		code: text("code").notNull().unique(),
		name: text("name").notNull(),
		description: text("description"),
		type: text("type").notNull(), // percentage, fixed, free_shipping
		value: text("value").notNull(),
		minimumAmount: text("minimumAmount"),
		maximumDiscount: text("maximumDiscount"),
		usageLimit: integer("usageLimit"),
		usageCount: integer("usageCount").notNull().default(0),
		userUsageLimit: integer("userUsageLimit").notNull().default(1),
		active: integer("active", { mode: "boolean" }).notNull().default(true),
		startsAt: integer("startsAt", { mode: "timestamp" }),
		expiresAt: integer("expiresAt", { mode: "timestamp" }),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" }).$onUpdate(() => new Date()),
	},
	(t) => ({
		codeIdx: index("coupon_code_idx").on(t.code),
		activeIdx: index("coupon_active_idx").on(t.active),
		expiresAtIdx: index("coupon_expires_at_idx").on(t.expiresAt),
	}),
);

export const couponUsage = createTable(
	"coupon_usage",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		couponId: text("couponId").notNull().references(() => coupons.id, { onDelete: "cascade" }),
		userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
		orderId: text("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
		discountAmount: text("discountAmount").notNull(),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
	},
	(t) => ({
		couponIdx: index("coupon_usage_coupon_idx").on(t.couponId),
		userIdx: index("coupon_usage_user_idx").on(t.userId),
		orderIdx: index("coupon_usage_order_idx").on(t.orderId),
	}),
);

// ============================================================================
// NOTIFICATION TABLES
// ============================================================================

export const notifications = createTable(
	"notification",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
		type: text("type").notNull(), // order_update, product_back_in_stock, promotion, etc.
		title: text("title").notNull(),
		message: text("message").notNull(),
		data: text("data", { mode: "json" }).$type<Record<string, unknown>>(),
		read: integer("read", { mode: "boolean" }).notNull().default(false),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
	},
	(t) => ({
		userIdx: index("notification_user_idx").on(t.userId),
		typeIdx: index("notification_type_idx").on(t.type),
		readIdx: index("notification_read_idx").on(t.read),
		createdAtIdx: index("notification_created_at_idx").on(t.createdAt),
	}),
);

// ============================================================================
// ANALYTICS TABLES
// ============================================================================

export const productViews = createTable(
	"product_view",
	{
		id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
		productId: text("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
		userId: text("userId").references(() => users.id, { onDelete: "set null" }),
		sessionId: text("sessionId"),
		ipAddress: text("ipAddress"),
		userAgent: text("userAgent"),
		referrer: text("referrer"),
		createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
	},
	(t) => ({
		productIdx: index("product_view_product_idx").on(t.productId),
		userIdx: index("product_view_user_idx").on(t.userId),
		sessionIdx: index("product_view_session_idx").on(t.sessionId),
		createdAtIdx: index("product_view_created_at_idx").on(t.createdAt),
	}),
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