import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { products } from "@/server/db/schema";

export const productsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return db.query.products.findMany({
      orderBy: [products.createdAt.desc()],
    });
  }),

  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    const product = await db.query.products.findFirst({
      where: eq(products.id, input),
    });

    if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    return product;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        active: z.boolean().default(true),
        categoryId: z.string(),
        price: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return db.insert(products).values(input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        active: z.boolean(),
        categoryId: z.string(),
        price: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const { id, ...data } = input;
      return db.update(products).set(data).where(eq(products.id, id));
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    return db.delete(products).where(eq(products.id, input));
  }),

  toggleActive: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    const found = await db.query.products.findFirst({
      where: eq(products.id, input),
    });

    if (!found) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

    return db.update(products).set({ active: !found.active }).where(eq(products.id, input));
  }),
});
