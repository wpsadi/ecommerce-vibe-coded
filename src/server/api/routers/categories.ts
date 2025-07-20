import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, asc } from "drizzle-orm";
import { products, categories } from "@/server/db/schema";

export const categoriesRouter = createTRPCRouter({
	getAll: publicProcedure.query(async () => {
		const categoriesData = await db.select()
			.from(categories)
			.leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.active, true)))
			.orderBy(asc(categories.sortOrder), asc(categories.name));

		// Group by category
		const grouped = categoriesData.reduce((acc, row) => {
			const cat = row.category;
			if (!cat) return acc;

			if (!acc[cat.id]) {
				acc[cat.id] = { ...cat, productCount: 0 };
			}

			if (row.product !== undefined) acc[cat.id].productCount += 1;

			return acc;
		}, {} as Record<string, typeof categories.$inferSelect & { productCount: number }>);

		return Object.values(grouped);
	}),

	getFeatured: publicProcedure.query(async () => {
		const featuredData = await db.select()
			.from(categories)
			.leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.active, true)))
			.where(eq(categories.featured, true))
			.orderBy(asc(categories.sortOrder), asc(categories.name));

		const grouped = featuredData.reduce((acc, row) => {
			const cat = row.category;
			if (!cat) return acc;

			if (!acc[cat.id]) {
				acc[cat.id] = { ...cat, productCount: 0 };
			}

			if (row.product != null) acc[cat.id].productCount += 1;

			return acc;
		}, {} as Record<string, typeof categories.$inferSelect & { productCount: number }>);

		return Object.values(grouped);
	}),

	getById: publicProcedure.input(z.string()).query(async ({ input }) => {
		const [found] = await db.select().from(categories).where(eq(categories.id, input));
		if (!found) throw new TRPCError({ code: "NOT_FOUND" });
		return found;
	}),

	getBySlug: publicProcedure.input(z.string()).query(async ({ input }) => {
		const [found] = await db.select().from(categories).where(eq(categories.slug, input));
		if (!found) throw new TRPCError({ code: "NOT_FOUND" });
		return found;
	}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string(),
				slug: z.string(),
				description: z.string().optional(),
				image: z.string().optional(),
				featured: z.boolean().optional(),
				sortOrder: z.number().optional(),
				seoTitle: z.string().optional(),
				seoDescription: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
			}

			return db.insert(categories).values(input);
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string(),
				slug: z.string(),
				description: z.string().optional(),
				image: z.string().optional(),
				featured: z.boolean().optional(),
				sortOrder: z.number().optional(),
				seoTitle: z.string().optional(),
				seoDescription: z.string().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
			}

			const { id, ...data } = input;
			return db.update(categories).set(data).where(eq(categories.id, id));
		}),

	delete: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
		if (ctx.session.user.role !== "admin") {
			throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
		}

		return db.delete(categories).where(eq(categories.id, input));
	}),

	toggleFeatured: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
		if (ctx.session.user.role !== "admin") {
			throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
		}

		const [found] = await db.select().from(categories).where(eq(categories.id, input));
		if (!found) throw new TRPCError({ code: "NOT_FOUND" });

		return db.update(categories).set({ featured: !found.featured }).where(eq(categories.id, input));
	}),
});
