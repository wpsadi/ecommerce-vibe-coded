import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, asc, desc, eq, ilike, sql, count, avg } from "drizzle-orm";
import { products, productImages, productReviews, categories } from "@/server/db/schema";

export const productsRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        featured: z.boolean().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["name", "price", "created_at", "rating"]).optional().default("created_at"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
        limit: z.number().min(1).max(100).optional().default(24),
        offset: z.number().min(0).optional().default(0),
      }).optional().default({})
    )
    .query(async ({ input = {} }) => {
      const {
        categoryId,
        featured,
        search,
        sortBy = "created_at",
        sortOrder = "desc",
        limit = 24,
        offset = 0,
      } = input;

      // Build where conditions
      const whereConditions: any[] = [eq(products.active, true)];
      
      if (categoryId) {
        whereConditions.push(eq(products.categoryId, categoryId));
      }
      
      if (featured) {
        whereConditions.push(eq(products.featured, true));
      }
      
      if (search) {
        whereConditions.push(ilike(products.name, `%${search}%`));
      }

      // Build order by
      let orderByField: any;
      switch (sortBy) {
        case "name":
          orderByField = products.name;
          break;
        case "price":
          orderByField = products.price;
          break;
        case "rating":
          // For rating, we'll need to do this in a subquery later
          orderByField = products.createdAt;
          break;
        default:
          orderByField = products.createdAt;
      }

      const orderDirection = sortOrder === "asc" ? asc : desc;

      // Get products with related data
      const productsData = await db
        .select({
          product: products,
          primaryImageUrl: productImages.url,
          category: categories,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(
          productImages,
          and(
            eq(productImages.productId, products.id),
            eq(productImages.isPrimary, true)
          )
        )
        .where(and(...whereConditions))
        .orderBy(orderDirection(orderByField))
        .limit(limit)
        .offset(offset);

      // Get all images for each product
      let allImages: { productId: string; url: string; isPrimary: boolean; sortOrder: number }[] = [];
      
      if (productIds.length > 0) {
        allImages = await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
            isPrimary: productImages.isPrimary,
            sortOrder: productImages.sortOrder,
          })
          .from(productImages)
          .where(sql`${productImages.productId} = ANY(${productIds})`)
          .orderBy(asc(productImages.sortOrder), desc(productImages.isPrimary));
      }

      // Get review stats for each product
      const productIds = productsData.map(p => p.product.id);
      
      let reviewStats: { productId: string; averageRating: number; reviewCount: number }[] = [];
      
      if (productIds.length > 0) {
        const reviewData = await db
          .select({
            productId: productReviews.productId,
            averageRating: avg(productReviews.rating),
            reviewCount: count(productReviews.id),
          })
          .from(productReviews)
          .where(
            and(
              sql`${productReviews.productId} = ANY(${productIds})`,
              eq(productReviews.approved, true)
            )
          )
          .groupBy(productReviews.productId);

        reviewStats = reviewData.map(r => ({
          productId: r.productId,
          averageRating: Number(r.averageRating) || 0,
          reviewCount: Number(r.reviewCount) || 0,
        }));
      }

      // Combine product data with review stats and images
      const enrichedProducts = productsData.map(({ product, primaryImageUrl, category }) => {
        const stats = reviewStats.find(s => s.productId === product.id);
        const productImages = allImages.filter(img => img.productId === product.id);
        
        return {
          ...product,
          primaryImage: primaryImageUrl || undefined,
          images: productImages,
          category,
          averageRating: stats?.averageRating || 0,
          reviewCount: stats?.reviewCount || 0,
        };
      });

      return enrichedProducts;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const productData = await db
        .select({
          product: products,
          category: categories,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.id, input.id))
        .limit(1);

      if (!productData[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const { product, category } = productData[0];

      // Get images
      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, input.id))
        .orderBy(asc(productImages.sortOrder), desc(productImages.isPrimary));

      // Get review stats
      const reviewData = await db
        .select({
          averageRating: avg(productReviews.rating),
          reviewCount: count(productReviews.id),
        })
        .from(productReviews)
        .where(
          and(
            eq(productReviews.productId, input.id),
            eq(productReviews.approved, true)
          )
        );

      const stats = reviewData[0] || { averageRating: 0, reviewCount: 0 };
      const primaryImage = images.find(img => img.isPrimary)?.url || images[0]?.url;

      return {
        ...product,
        category,
        images,
        primaryImage,
        averageRating: Number(stats.averageRating) || 0,
        reviewCount: Number(stats.reviewCount) || 0,
      };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const productData = await db
        .select({
          product: products,
          category: categories,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.slug, input.slug))
        .limit(1);

      if (!productData[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const { product, category } = productData[0];

      // Get images
      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(asc(productImages.sortOrder), desc(productImages.isPrimary));

      // Get review stats
      const reviewData = await db
        .select({
          averageRating: avg(productReviews.rating),
          reviewCount: count(productReviews.id),
        })
        .from(productReviews)
        .where(
          and(
            eq(productReviews.productId, product.id),
            eq(productReviews.approved, true)
          )
        );

      const stats = reviewData[0] || { averageRating: 0, reviewCount: 0 };
      const primaryImage = images.find(img => img.isPrimary)?.url || images[0]?.url;

      return {
        ...product,
        category,
        images,
        primaryImage,
        averageRating: Number(stats.averageRating) || 0,
        reviewCount: Number(stats.reviewCount) || 0,
      };
    }),

  getImages: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input }) => {
      return await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, input.productId))
        .orderBy(asc(productImages.sortOrder), desc(productImages.isPrimary));
    }),

  getReviews: publicProcedure
    .input(z.object({
      productId: z.string(),
      approved: z.boolean().optional().default(true),
      limit: z.number().min(1).max(50).optional().default(10),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ input }) => {
      const whereConditions = [eq(productReviews.productId, input.productId)];
      
      if (input.approved !== undefined) {
        whereConditions.push(eq(productReviews.approved, input.approved));
      }

      return await db
        .select()
        .from(productReviews)
        .where(and(...whereConditions))
        .orderBy(desc(productReviews.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getLowStock: publicProcedure
    .input(z.object({ threshold: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      return await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.active, true),
            sql`${products.stock} <= ${input.threshold}`
          )
        )
        .orderBy(asc(products.stock));
    }),

  updateStock: protectedProcedure
    .input(z.object({
      id: z.string(),
      stock: z.number().min(0),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const result = await db
        .update(products)
        .set({ stock: input.stock })
        .where(eq(products.id, input.id))
        .returning();

      if (!result[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      return result[0];
    }),

  assignToCategory: protectedProcedure
    .input(z.object({
      productIds: z.array(z.string()).min(1),
      categoryId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      // Verify category exists
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, input.categoryId),
      });

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      // Update products
      const result = await db
        .update(products)
        .set({ categoryId: input.categoryId })
        .where(sql`${products.id} = ANY(${input.productIds})`)
        .returning();

      return result;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().min(1),
        shortDescription: z.string().optional(),
        sku: z.string().optional(),
        price: z.string().transform(val => parseFloat(val)),
        originalPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
        costPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
        categoryId: z.string(),
        stock: z.number().min(0).default(0),
        lowStockThreshold: z.number().min(0).default(10),
        weight: z.number().optional(),
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
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        images: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const { images, ...productData } = input;

      // Insert product
      const [product] = await db.insert(products).values(productData).returning();

      if (!product) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create product" });
      }

      // Insert images if provided
      if (images && images.length > 0) {
        const imageData = images.map((url, index) => ({
          productId: product.id,
          url,
          sortOrder: index,
          isPrimary: index === 0,
        }));

        await db.insert(productImages).values(imageData);
      }

      return product;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().min(1),
        shortDescription: z.string().optional(),
        sku: z.string().optional(),
        price: z.string().transform(val => parseFloat(val)),
        originalPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
        costPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
        categoryId: z.string(),
        stock: z.number().min(0),
        lowStockThreshold: z.number().min(0).default(10),
        weight: z.number().optional(),
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
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        images: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const { id, images, ...productData } = input;

      // Update product
      const [product] = await db
        .update(products)
        .set(productData)
        .where(eq(products.id, id))
        .returning();

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      // Update images if provided
      if (images && images.length > 0) {
        // Delete existing images
        await db.delete(productImages).where(eq(productImages.productId, id));

        // Insert new images
        const imageData = images.map((url, index) => ({
          productId: id,
          url,
          sortOrder: index,
          isPrimary: index === 0,
        }));

        await db.insert(productImages).values(imageData);
      }

      return product;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const [product] = await db
        .delete(products)
        .where(eq(products.id, input.id))
        .returning();

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      return product;
    }),

  toggleActive: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const found = await db.query.products.findFirst({
        where: eq(products.id, input),
      });

      if (!found) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const [updated] = await db
        .update(products)
        .set({ active: !found.active })
        .where(eq(products.id, input))
        .returning();

      return updated;
    }),
});
