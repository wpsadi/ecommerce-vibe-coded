import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { coupons } from "@/server/db/schema-pg";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const couponsRouter = createTRPCRouter({
	getCouponByCode: protectedProcedure
		.input(z.object({ code: z.string().min(1) }))
		.query(async ({ input, ctx }) => {
			try {
				const coupon = await ctx.db
					.select()
					.from(coupons)
					.where(eq(coupons.code, input.code))
					.limit(1);

				if (!coupon[0]) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Coupon not found",
					});
				}

				return coupon[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch coupon",
					cause: error,
				});
			}
		}),
});
