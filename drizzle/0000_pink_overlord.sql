CREATE TABLE `ecommerce_account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `ecommerce_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `ecommerce_account` (`userId`);--> statement-breakpoint
CREATE TABLE `ecommerce_address` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text DEFAULT 'shipping' NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`company` text,
	`phone` text,
	`addressLine1` text NOT NULL,
	`addressLine2` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`postalCode` text NOT NULL,
	`country` text DEFAULT 'India' NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `ecommerce_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `address_user_idx` ON `ecommerce_address` (`userId`);--> statement-breakpoint
CREATE INDEX `address_type_idx` ON `ecommerce_address` (`type`);--> statement-breakpoint
CREATE INDEX `address_default_idx` ON `ecommerce_address` (`isDefault`);--> statement-breakpoint
CREATE TABLE `ecommerce_cart_item` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`productId` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `ecommerce_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `ecommerce_product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cart_item_user_idx` ON `ecommerce_cart_item` (`userId`);--> statement-breakpoint
CREATE INDEX `cart_item_product_idx` ON `ecommerce_cart_item` (`productId`);--> statement-breakpoint
CREATE INDEX `cart_item_user_product_unique` ON `ecommerce_cart_item` (`userId`,`productId`);--> statement-breakpoint
CREATE TABLE `ecommerce_category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text,
	`image` text,
	`featured` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`metaTitle` text,
	`metaDescription` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecommerce_category_slug_unique` ON `ecommerce_category` (`slug`);--> statement-breakpoint
CREATE INDEX `category_slug_idx` ON `ecommerce_category` (`slug`);--> statement-breakpoint
CREATE INDEX `category_featured_idx` ON `ecommerce_category` (`featured`);--> statement-breakpoint
CREATE INDEX `category_active_idx` ON `ecommerce_category` (`active`);--> statement-breakpoint
CREATE INDEX `category_sort_order_idx` ON `ecommerce_category` (`sortOrder`);--> statement-breakpoint
CREATE TABLE `ecommerce_coupon_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`couponId` text NOT NULL,
	`userId` text NOT NULL,
	`orderId` text NOT NULL,
	`discountAmount` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`couponId`) REFERENCES `ecommerce_coupon`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `ecommerce_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`orderId`) REFERENCES `ecommerce_order`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coupon_usage_coupon_idx` ON `ecommerce_coupon_usage` (`couponId`);--> statement-breakpoint
CREATE INDEX `coupon_usage_user_idx` ON `ecommerce_coupon_usage` (`userId`);--> statement-breakpoint
CREATE INDEX `coupon_usage_order_idx` ON `ecommerce_coupon_usage` (`orderId`);--> statement-breakpoint
CREATE TABLE `ecommerce_coupon` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`value` text NOT NULL,
	`minimumAmount` text,
	`maximumDiscount` text,
	`usageLimit` integer,
	`usageCount` integer DEFAULT 0 NOT NULL,
	`userUsageLimit` integer DEFAULT 1 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`startsAt` integer,
	`expiresAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecommerce_coupon_code_unique` ON `ecommerce_coupon` (`code`);--> statement-breakpoint
CREATE INDEX `coupon_code_idx` ON `ecommerce_coupon` (`code`);--> statement-breakpoint
CREATE INDEX `coupon_active_idx` ON `ecommerce_coupon` (`active`);--> statement-breakpoint
CREATE INDEX `coupon_expires_at_idx` ON `ecommerce_coupon` (`expiresAt`);--> statement-breakpoint
CREATE TABLE `ecommerce_notification` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`data` text,
	`read` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `ecommerce_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `ecommerce_notification` (`userId`);--> statement-breakpoint
CREATE INDEX `notification_type_idx` ON `ecommerce_notification` (`type`);--> statement-breakpoint
CREATE INDEX `notification_read_idx` ON `ecommerce_notification` (`read`);--> statement-breakpoint
CREATE INDEX `notification_created_at_idx` ON `ecommerce_notification` (`createdAt`);--> statement-breakpoint
CREATE TABLE `ecommerce_order_item` (
	`id` text PRIMARY KEY NOT NULL,
	`orderId` text NOT NULL,
	`productId` text NOT NULL,
	`productName` text NOT NULL,
	`productSku` text,
	`productImage` text,
	`quantity` integer NOT NULL,
	`unitPrice` text NOT NULL,
	`totalPrice` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `ecommerce_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `ecommerce_product`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `order_item_order_idx` ON `ecommerce_order_item` (`orderId`);--> statement-breakpoint
CREATE INDEX `order_item_product_idx` ON `ecommerce_order_item` (`productId`);--> statement-breakpoint
CREATE TABLE `ecommerce_order_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`orderId` text NOT NULL,
	`status` text NOT NULL,
	`comment` text,
	`notifyCustomer` integer DEFAULT false NOT NULL,
	`createdBy` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `ecommerce_order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`createdBy`) REFERENCES `ecommerce_user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `order_status_history_order_idx` ON `ecommerce_order_status_history` (`orderId`);--> statement-breakpoint
CREATE INDEX `order_status_history_status_idx` ON `ecommerce_order_status_history` (`status`);--> statement-breakpoint
CREATE INDEX `order_status_history_created_at_idx` ON `ecommerce_order_status_history` (`createdAt`);--> statement-breakpoint
CREATE TABLE `ecommerce_order` (
	`id` text PRIMARY KEY NOT NULL,
	`orderNumber` text NOT NULL,
	`userId` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paymentStatus` text DEFAULT 'pending' NOT NULL,
	`paymentMethod` text NOT NULL,
	`paymentId` text,
	`subtotal` text NOT NULL,
	`taxAmount` text DEFAULT '0' NOT NULL,
	`shippingAmount` text DEFAULT '0' NOT NULL,
	`discountAmount` text DEFAULT '0' NOT NULL,
	`totalAmount` text NOT NULL,
	`shippingAddress` text NOT NULL,
	`billingAddress` text,
	`trackingNumber` text,
	`estimatedDelivery` integer,
	`deliveredAt` integer,
	`customerNotes` text,
	`adminNotes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `ecommerce_user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecommerce_order_orderNumber_unique` ON `ecommerce_order` (`orderNumber`);--> statement-breakpoint
CREATE INDEX `order_number_idx` ON `ecommerce_order` (`orderNumber`);--> statement-breakpoint
CREATE INDEX `order_user_idx` ON `ecommerce_order` (`userId`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `ecommerce_order` (`status`);--> statement-breakpoint
CREATE INDEX `order_payment_status_idx` ON `ecommerce_order` (`paymentStatus`);--> statement-breakpoint
CREATE INDEX `order_created_at_idx` ON `ecommerce_order` (`createdAt`);--> statement-breakpoint
CREATE TABLE `ecommerce_product_image` (
	`id` text PRIMARY KEY NOT NULL,
	`productId` text NOT NULL,
	`url` text NOT NULL,
	`altText` text,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`isPrimary` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`productId`) REFERENCES `ecommerce_product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_image_product_idx` ON `ecommerce_product_image` (`productId`);--> statement-breakpoint
CREATE INDEX `product_image_sort_order_idx` ON `ecommerce_product_image` (`sortOrder`);--> statement-breakpoint
CREATE INDEX `product_image_primary_idx` ON `ecommerce_product_image` (`isPrimary`);--> statement-breakpoint
CREATE TABLE `ecommerce_product_review` (
	`id` text PRIMARY KEY NOT NULL,
	`productId` text NOT NULL,
	`userId` text NOT NULL,
	`orderId` text,
	`rating` integer NOT NULL,
	`title` text,
	`comment` text,
	`verified` integer DEFAULT false NOT NULL,
	`helpful` integer DEFAULT 0 NOT NULL,
	`reported` integer DEFAULT false NOT NULL,
	`approved` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`productId`) REFERENCES `ecommerce_product`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `ecommerce_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`orderId`) REFERENCES `ecommerce_order`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `product_review_product_idx` ON `ecommerce_product_review` (`productId`);--> statement-breakpoint
CREATE INDEX `product_review_user_idx` ON `ecommerce_product_review` (`userId`);--> statement-breakpoint
CREATE INDEX `product_review_rating_idx` ON `ecommerce_product_review` (`rating`);--> statement-breakpoint
CREATE INDEX `product_review_verified_idx` ON `ecommerce_product_review` (`verified`);--> statement-breakpoint
CREATE INDEX `product_review_approved_idx` ON `ecommerce_product_review` (`approved`);--> statement-breakpoint
CREATE TABLE `ecommerce_product_view` (
	`id` text PRIMARY KEY NOT NULL,
	`productId` text NOT NULL,
	`userId` text,
	`sessionId` text,
	`ipAddress` text,
	`userAgent` text,
	`referrer` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`productId`) REFERENCES `ecommerce_product`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `ecommerce_user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `product_view_product_idx` ON `ecommerce_product_view` (`productId`);--> statement-breakpoint
CREATE INDEX `product_view_user_idx` ON `ecommerce_product_view` (`userId`);--> statement-breakpoint
CREATE INDEX `product_view_session_idx` ON `ecommerce_product_view` (`sessionId`);--> statement-breakpoint
CREATE INDEX `product_view_created_at_idx` ON `ecommerce_product_view` (`createdAt`);--> statement-breakpoint
CREATE TABLE `ecommerce_product` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`shortDescription` text,
	`sku` text,
	`price` text NOT NULL,
	`originalPrice` text,
	`costPrice` text,
	`categoryId` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`lowStockThreshold` integer DEFAULT 10 NOT NULL,
	`weight` real,
	`dimensions` text,
	`specifications` text DEFAULT '{}' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`digital` integer DEFAULT false NOT NULL,
	`trackQuantity` integer DEFAULT true NOT NULL,
	`allowBackorder` integer DEFAULT false NOT NULL,
	`metaTitle` text,
	`metaDescription` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`categoryId`) REFERENCES `ecommerce_category`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecommerce_product_slug_unique` ON `ecommerce_product` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `ecommerce_product_sku_unique` ON `ecommerce_product` (`sku`);--> statement-breakpoint
CREATE INDEX `product_slug_idx` ON `ecommerce_product` (`slug`);--> statement-breakpoint
CREATE INDEX `product_category_idx` ON `ecommerce_product` (`categoryId`);--> statement-breakpoint
CREATE INDEX `product_sku_idx` ON `ecommerce_product` (`sku`);--> statement-breakpoint
CREATE INDEX `product_price_idx` ON `ecommerce_product` (`price`);--> statement-breakpoint
CREATE INDEX `product_stock_idx` ON `ecommerce_product` (`stock`);--> statement-breakpoint
CREATE INDEX `product_featured_idx` ON `ecommerce_product` (`featured`);--> statement-breakpoint
CREATE INDEX `product_active_idx` ON `ecommerce_product` (`active`);--> statement-breakpoint
CREATE INDEX `product_created_at_idx` ON `ecommerce_product` (`createdAt`);--> statement-breakpoint
CREATE TABLE `ecommerce_session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `ecommerce_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `ecommerce_session` (`userId`);--> statement-breakpoint
CREATE TABLE `ecommerce_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer,
	`image` text,
	`password` text,
	`phone` text,
	`role` text DEFAULT 'user' NOT NULL,
	`blocked` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecommerce_user_email_unique` ON `ecommerce_user` (`email`);--> statement-breakpoint
CREATE INDEX `user_email_idx` ON `ecommerce_user` (`email`);--> statement-breakpoint
CREATE INDEX `user_role_idx` ON `ecommerce_user` (`role`);--> statement-breakpoint
CREATE TABLE `ecommerce_verification_token` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE TABLE `ecommerce_wishlist_item` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`productId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `ecommerce_user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `ecommerce_product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wishlist_item_user_idx` ON `ecommerce_wishlist_item` (`userId`);--> statement-breakpoint
CREATE INDEX `wishlist_item_product_idx` ON `ecommerce_wishlist_item` (`productId`);--> statement-breakpoint
CREATE INDEX `wishlist_item_user_product_unique` ON `ecommerce_wishlist_item` (`userId`,`productId`);