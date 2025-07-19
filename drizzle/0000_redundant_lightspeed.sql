CREATE TABLE "ecommerce_account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "ecommerce_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "ecommerce_address" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'shipping' NOT NULL,
	"firstName" varchar(255) NOT NULL,
	"lastName" varchar(255) NOT NULL,
	"company" varchar(255),
	"phone" varchar(20),
	"addressLine1" varchar(255) NOT NULL,
	"addressLine2" varchar(255),
	"city" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"postalCode" varchar(20) NOT NULL,
	"country" varchar(255) DEFAULT 'India' NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ecommerce_cart_item" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"productId" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ecommerce_category" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(10),
	"image" varchar(500),
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"metaTitle" varchar(255),
	"metaDescription" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "ecommerce_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ecommerce_coupon_usage" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"couponId" varchar(255) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"orderId" varchar(255) NOT NULL,
	"discountAmount" numeric(10, 2) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_coupon" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"minimumAmount" numeric(10, 2),
	"maximumDiscount" numeric(10, 2),
	"usageLimit" integer,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"userUsageLimit" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"startsAt" timestamp with time zone,
	"expiresAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "ecommerce_coupon_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ecommerce_notification" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_order_item" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"orderId" varchar(255) NOT NULL,
	"productId" varchar(255) NOT NULL,
	"productName" varchar(255) NOT NULL,
	"productSku" varchar(100),
	"productImage" varchar(500),
	"quantity" integer NOT NULL,
	"unitPrice" numeric(10, 2) NOT NULL,
	"totalPrice" numeric(10, 2) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_order_status_history" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"orderId" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"comment" text,
	"notifyCustomer" boolean DEFAULT false NOT NULL,
	"createdBy" varchar(255),
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_order" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"orderNumber" varchar(50) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"paymentStatus" varchar(50) DEFAULT 'pending' NOT NULL,
	"paymentMethod" varchar(50) NOT NULL,
	"paymentId" varchar(255),
	"subtotal" numeric(10, 2) NOT NULL,
	"taxAmount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"shippingAmount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discountAmount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"totalAmount" numeric(10, 2) NOT NULL,
	"shippingAddress" jsonb NOT NULL,
	"billingAddress" jsonb,
	"trackingNumber" varchar(255),
	"estimatedDelivery" timestamp with time zone,
	"deliveredAt" timestamp with time zone,
	"customerNotes" text,
	"adminNotes" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "ecommerce_order_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "ecommerce_product_image" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"productId" varchar(255) NOT NULL,
	"url" varchar(500) NOT NULL,
	"altText" varchar(255),
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_product_review" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"productId" varchar(255) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"orderId" varchar(255),
	"rating" integer NOT NULL,
	"title" varchar(255),
	"comment" text,
	"verified" boolean DEFAULT false NOT NULL,
	"helpful" integer DEFAULT 0 NOT NULL,
	"reported" boolean DEFAULT false NOT NULL,
	"approved" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ecommerce_product_view" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"productId" varchar(255) NOT NULL,
	"userId" varchar(255),
	"sessionId" varchar(255),
	"ipAddress" varchar(45),
	"userAgent" text,
	"referrer" varchar(500),
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_product" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"shortDescription" varchar(500),
	"sku" varchar(100),
	"price" numeric(10, 2) NOT NULL,
	"originalPrice" numeric(10, 2),
	"costPrice" numeric(10, 2),
	"categoryId" varchar(255) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"lowStockThreshold" integer DEFAULT 10 NOT NULL,
	"weight" numeric(8, 2),
	"dimensions" jsonb,
	"specifications" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"digital" boolean DEFAULT false NOT NULL,
	"trackQuantity" boolean DEFAULT true NOT NULL,
	"allowBackorder" boolean DEFAULT false NOT NULL,
	"metaTitle" varchar(255),
	"metaDescription" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "ecommerce_product_slug_unique" UNIQUE("slug"),
	CONSTRAINT "ecommerce_product_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "ecommerce_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255),
	"phone" varchar(20),
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "ecommerce_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ecommerce_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "ecommerce_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "ecommerce_wishlist_item" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"productId" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ecommerce_account" ADD CONSTRAINT "ecommerce_account_userId_ecommerce_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."ecommerce_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_address" ADD CONSTRAINT "ecommerce_address_userId_ecommerce_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."ecommerce_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_cart_item" ADD CONSTRAINT "ecommerce_cart_item_userId_ecommerce_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."ecommerce_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_cart_item" ADD CONSTRAINT "ecommerce_cart_item_productId_ecommerce_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."ecommerce_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_coupon_usage" ADD CONSTRAINT "ecommerce_coupon_usage_couponId_ecommerce_coupon_id_fk" FOREIGN KEY ("couponId") REFERENCES "public"."ecommerce_coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_coupon_usage" ADD CONSTRAINT "ecommerce_coupon_usage_userId_ecommerce_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."ecommerce_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_coupon_usage" ADD CONSTRAINT "ecommerce_coupon_usage_orderId_ecommerce_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."ecommerce_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_notification" ADD CONSTRAINT "ecommerce_notification_userId_ecommerce_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."ecommerce_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_order_item" ADD CONSTRAINT "ecommerce_order_item_orderId_ecommerce_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."ecommerce_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_order_item" ADD CONSTRAINT "ecommerce_order_item_productId_ecommerce_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."ecommerce_product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_order_status_history" ADD CONSTRAINT "ecommerce_order_status_history_orderId_ecommerce_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."ecommerce_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_order_status_history" ADD CONSTRAINT "ecommerce_order_status_history_createdBy_ecommerce_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."ecommerce_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_order" ADD CONSTRAINT "ecommerce_order_userId_ecommerce_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."ecommerce_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_product_image" ADD CONSTRAINT "ecommerce_product_image_productId_ecommerce_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."ecommerce_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_product_review" ADD CONSTRAINT "ecommerce_product_review_productId_ecommerce_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."ecommerce_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_product_review" ADD CONSTRAINT "ecommerce_product_review_userId_ecommerce_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."ecommerce_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_product_review" ADD CONSTRAINT "ecommerce_product_review_orderId_ecommerce_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."ecommerce_order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_product_view" ADD CONSTRAINT "ecommerce_product_view_productId_ecommerce_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."ecommerce_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_product_view" ADD CONSTRAINT "ecommerce_product_view_userId_ecommerce_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."ecommerce_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_product" ADD CONSTRAINT "ecommerce_product_categoryId_ecommerce_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."ecommerce_category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_session" ADD CONSTRAINT "ecommerce_session_userId_ecommerce_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."ecommerce_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_wishlist_item" ADD CONSTRAINT "ecommerce_wishlist_item_userId_ecommerce_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."ecommerce_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_wishlist_item" ADD CONSTRAINT "ecommerce_wishlist_item_productId_ecommerce_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."ecommerce_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "ecommerce_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "address_user_idx" ON "ecommerce_address" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "address_type_idx" ON "ecommerce_address" USING btree ("type");--> statement-breakpoint
CREATE INDEX "address_default_idx" ON "ecommerce_address" USING btree ("isDefault");--> statement-breakpoint
CREATE INDEX "cart_item_user_idx" ON "ecommerce_cart_item" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "cart_item_product_idx" ON "ecommerce_cart_item" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "cart_item_user_product_unique" ON "ecommerce_cart_item" USING btree ("userId","productId");--> statement-breakpoint
CREATE INDEX "category_slug_idx" ON "ecommerce_category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "category_featured_idx" ON "ecommerce_category" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "category_active_idx" ON "ecommerce_category" USING btree ("active");--> statement-breakpoint
CREATE INDEX "category_sort_order_idx" ON "ecommerce_category" USING btree ("sortOrder");--> statement-breakpoint
CREATE INDEX "coupon_usage_coupon_idx" ON "ecommerce_coupon_usage" USING btree ("couponId");--> statement-breakpoint
CREATE INDEX "coupon_usage_user_idx" ON "ecommerce_coupon_usage" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "coupon_usage_order_idx" ON "ecommerce_coupon_usage" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "coupon_code_idx" ON "ecommerce_coupon" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupon_active_idx" ON "ecommerce_coupon" USING btree ("active");--> statement-breakpoint
CREATE INDEX "coupon_expires_at_idx" ON "ecommerce_coupon" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "ecommerce_notification" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "ecommerce_notification" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_read_idx" ON "ecommerce_notification" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notification_created_at_idx" ON "ecommerce_notification" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "order_item_order_idx" ON "ecommerce_order_item" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "order_item_product_idx" ON "ecommerce_order_item" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "order_status_history_order_idx" ON "ecommerce_order_status_history" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "order_status_history_status_idx" ON "ecommerce_order_status_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_status_history_created_at_idx" ON "ecommerce_order_status_history" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "order_number_idx" ON "ecommerce_order" USING btree ("orderNumber");--> statement-breakpoint
CREATE INDEX "order_user_idx" ON "ecommerce_order" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "ecommerce_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_payment_status_idx" ON "ecommerce_order" USING btree ("paymentStatus");--> statement-breakpoint
CREATE INDEX "order_created_at_idx" ON "ecommerce_order" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "product_image_product_idx" ON "ecommerce_product_image" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "product_image_sort_order_idx" ON "ecommerce_product_image" USING btree ("sortOrder");--> statement-breakpoint
CREATE INDEX "product_image_primary_idx" ON "ecommerce_product_image" USING btree ("isPrimary");--> statement-breakpoint
CREATE INDEX "product_review_product_idx" ON "ecommerce_product_review" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "product_review_user_idx" ON "ecommerce_product_review" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "product_review_rating_idx" ON "ecommerce_product_review" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "product_review_verified_idx" ON "ecommerce_product_review" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "product_review_approved_idx" ON "ecommerce_product_review" USING btree ("approved");--> statement-breakpoint
CREATE INDEX "product_view_product_idx" ON "ecommerce_product_view" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "product_view_user_idx" ON "ecommerce_product_view" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "product_view_session_idx" ON "ecommerce_product_view" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "product_view_created_at_idx" ON "ecommerce_product_view" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "product_slug_idx" ON "ecommerce_product" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_category_idx" ON "ecommerce_product" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "product_sku_idx" ON "ecommerce_product" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_price_idx" ON "ecommerce_product" USING btree ("price");--> statement-breakpoint
CREATE INDEX "product_stock_idx" ON "ecommerce_product" USING btree ("stock");--> statement-breakpoint
CREATE INDEX "product_featured_idx" ON "ecommerce_product" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "product_active_idx" ON "ecommerce_product" USING btree ("active");--> statement-breakpoint
CREATE INDEX "product_created_at_idx" ON "ecommerce_product" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "ecommerce_session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "ecommerce_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "ecommerce_user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "wishlist_item_user_idx" ON "ecommerce_wishlist_item" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "wishlist_item_product_idx" ON "ecommerce_wishlist_item" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "wishlist_item_user_product_unique" ON "ecommerce_wishlist_item" USING btree ("userId","productId");