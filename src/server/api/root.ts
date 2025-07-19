import { cartRouter } from "@/server/api/routers/cart";
import { categoriesRouter } from "@/server/api/routers/categories";
import { couponsRouter } from "@/server/api/routers/coupons";
import { ordersRouter } from "@/server/api/routers/orders";
import { productsRouter } from "@/server/api/routers/products";
import { usersRouter } from "@/server/api/routers/users";
import { wishlistRouter } from "@/server/api/routers/wishlist";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	products: productsRouter,
	categories: categoriesRouter,
	cart: cartRouter,
	wishlist: wishlistRouter,
	orders: ordersRouter,
	users: usersRouter,
	coupons: couponsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
