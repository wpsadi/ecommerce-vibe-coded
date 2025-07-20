import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { type NewAddress, addresses, users } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { and, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";

const updateProfileSchema = z.object({
	name: z.string().min(1, "Name is required"),
	phone: z.string().optional(),
});

const createAddressSchema = z.object({
	type: z.enum(["shipping", "billing"]).default("shipping"),
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
	isDefault: z.boolean().optional(),
});

const updateAddressSchema = createAddressSchema.partial().extend({
	id: z.string().min(1, "Address ID is required"),
});

const signupSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	phone: z.string().optional(),
});

export const usersRouter = createTRPCRouter({
	// Register a new user
	signup: publicProcedure
		.input(signupSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const { name, email, password, phone } = input;

				// Check if user with email already exists
				const existingUser = await ctx.db.query.users.findFirst({
					where: (users, { eq }) => eq(users.email, email),
				});

				if (existingUser) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "User with this email already exists",
					});
				}

				const hashedPassword = await hash(password, 10);

				const newUser = await ctx.db
					.insert(users)
					.values({
						name,
						email,
						password: hashedPassword,
						phone: phone === "" ? null : phone,
						role: "user", // Default role
					})
					.returning();

				return newUser[0];
			} catch (error) {
				console.error("Detailed signup error:", error);
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to register user",
					cause: error,
				});
			}
		}),

	// Get current user profile
	getProfile: protectedProcedure.query(async ({ ctx }) => {
		try {
			const user = await ctx.db
				.select({
					id: users.id,
					name: users.name,
					email: users.email,
					phone: users.phone,
					role: users.role,
					createdAt: users.createdAt,
					updatedAt: users.updatedAt,
				})
				.from(users)
				.where(eq(users.id, ctx.session.user.id))
				.limit(1);

			if (!user[0]) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			return user[0];
		} catch (error) {
			if (error instanceof TRPCError) throw error;
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch user profile",
				cause: error,
			});
		}
	}),

	// Update user profile
	updateProfile: protectedProcedure
		.input(updateProfileSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const result = await ctx.db
					.update(users)
					.set({
						...input,
						updatedAt: new Date(),
					})
					.where(eq(users.id, ctx.session.user.id))
					.returning();

				if (!result[0]) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User not found",
					});
				}

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update profile",
					cause: error,
				});
			}
		}),

	// Get user addresses
	getAddresses: protectedProcedure
		.input(
			z.object({
				type: z.enum(["shipping", "billing"]).optional(),
			}),
		)
		.query(async ({ input, ctx }) => {
			try {
				let whereCondition = eq(addresses.userId, ctx.session.user.id);

				if (input.type) {
					whereCondition =
						and(
							eq(addresses.userId, ctx.session.user.id),
							eq(addresses.type, input.type),
						) ?? eq(addresses.userId, ctx.session.user.id);
				}

				return await ctx.db
					.select()
					.from(addresses)
					.where(whereCondition)
					.orderBy(desc(addresses.isDefault), desc(addresses.updatedAt));
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch addresses",
					cause: error,
				});
			}
		}),

	// Get address by ID
	getAddressById: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ input, ctx }) => {
			try {
				const address = await ctx.db
					.select()
					.from(addresses)
					.where(
						and(
							eq(addresses.id, input.id),
							eq(addresses.userId, ctx.session.user.id),
						),
					)
					.limit(1);

				if (!address[0]) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Address not found",
					});
				}

				return address[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch address",
					cause: error,
				});
			}
		}),

	// Create address
	createAddress: protectedProcedure
		.input(createAddressSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				// If this is set as default, unset other defaults of the same type
				if (input.isDefault) {
					await ctx.db
						.update(addresses)
						.set({ isDefault: false })
						.where(
							and(
								eq(addresses.userId, ctx.session.user.id),
								eq(addresses.type, input.type || "shipping"),
							),
						);
				}

				const addressData: NewAddress = {
					...input,
					userId: ctx.session.user.id,
				};

				const result = await ctx.db
					.insert(addresses)
					.values(addressData)
					.returning();

				return result[0];
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create address",
					cause: error,
				});
			}
		}),

	// Update address
	updateAddress: protectedProcedure
		.input(updateAddressSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				const { id, ...updateData } = input;

				// Verify address belongs to user
				const existingAddress = await ctx.db
					.select({ userId: addresses.userId, type: addresses.type })
					.from(addresses)
					.where(eq(addresses.id, id))
					.limit(1);

				if (
					!existingAddress[0] ||
					existingAddress[0].userId !== ctx.session.user.id
				) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Address not found",
					});
				}

				// If this is set as default, unset other defaults of the same type
				if (updateData.isDefault) {
					const addressType = updateData.type || existingAddress[0].type;
					await ctx.db
						.update(addresses)
						.set({ isDefault: false })
						.where(
							and(
								eq(addresses.userId, ctx.session.user.id),
								eq(addresses.type, addressType),
							),
						);
				}

				const result = await ctx.db
					.update(addresses)
					.set({
						...updateData,
						updatedAt: new Date(),
					})
					.where(eq(addresses.id, id))
					.returning();

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update address",
					cause: error,
				});
			}
		}),

	// Delete address
	deleteAddress: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			try {
				// Verify address belongs to user
				const address = await ctx.db
					.select({ userId: addresses.userId })
					.from(addresses)
					.where(eq(addresses.id, input.id))
					.limit(1);

				if (!address[0] || address[0].userId !== ctx.session.user.id) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Address not found",
					});
				}

				const result = await ctx.db
					.delete(addresses)
					.where(eq(addresses.id, input.id))
					.returning();

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete address",
					cause: error,
				});
			}
		}),

	// Set default address
	setDefaultAddress: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			try {
				// Verify address belongs to user and get its type
				const address = await ctx.db
					.select({ userId: addresses.userId, type: addresses.type })
					.from(addresses)
					.where(eq(addresses.id, input.id))
					.limit(1);

				if (!address[0] || address[0].userId !== ctx.session.user.id) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Address not found",
					});
				}

				// Unset other defaults of the same type
				await ctx.db
					.update(addresses)
					.set({ isDefault: false })
					.where(
						and(
							eq(addresses.userId, ctx.session.user.id),
							eq(addresses.type, address[0].type),
						),
					);

				// Set this address as default
				const result = await ctx.db
					.update(addresses)
					.set({ isDefault: true, updatedAt: new Date() })
					.where(eq(addresses.id, input.id))
					.returning();

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to set default address",
					cause: error,
				});
			}
		}),

	// Admin: Get all users
	getAllUsers: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				role: z.enum(["user", "admin"]).optional(),
				blocked: z.boolean().optional(),
				limit: z.number().min(1).max(100).optional(),
				offset: z.number().min(0).optional(),
			}),
		)
		.query(async ({ input, ctx }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			try {
				const { search, role, blocked, limit = 20, offset = 0 } = input;

				const conditions = [];

				if (search) {
					conditions.push(
						or(
							like(users.name, `%${search}%`),
							like(users.email, `%${search}%`),
						),
					);
				}

				if (role !== undefined) {
					conditions.push(eq(users.role, role));
				}

				if (blocked !== undefined) {
					conditions.push(eq(users.blocked, blocked));
				}

				const whereCondition =
					conditions.length > 0 ? and(...conditions) : undefined;

				return await ctx.db
					.select({
						id: users.id,
						name: users.name,
						email: users.email,
						phone: users.phone,
						role: users.role,
						blocked: users.blocked,
						createdAt: users.createdAt,
						updatedAt: users.updatedAt,
					})
					.from(users)
					.where(whereCondition)
					.orderBy(desc(users.createdAt))
					.limit(limit)
					.offset(offset);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch users",
					cause: error,
				});
			}
		}),

	// Admin: Block/unblock user
	toggleUserBlock: protectedProcedure
		.input(
			z.object({
				userId: z.string().min(1),
				blocked: z.boolean(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			// Prevent admin from blocking themselves
			if (input.userId === ctx.session.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot block yourself",
				});
			}

			try {
				const result = await ctx.db
					.update(users)
					.set({
						blocked: input.blocked,
						updatedAt: new Date(),
					})
					.where(eq(users.id, input.userId))
					.returning();

				if (!result[0]) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User not found",
					});
				}

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update user",
					cause: error,
				});
			}
		}),

	// Admin: Get user by ID
	getById: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ input, ctx }) => {
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			try {
				const user = await ctx.db
					.select()
					.from(users)
					.where(eq(users.id, input.id))
					.limit(1);

				if (!user[0]) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User not found",
					});
				}

				return user[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch user",
					cause: error,
				});
			}
		}),

	// Admin: Promote user to admin
	promoteToAdmin: protectedProcedure
		.input(z.object({ userId: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			try {
				const result = await ctx.db
					.update(users)
					.set({
						role: "admin",
						updatedAt: new Date(),
					})
					.where(eq(users.id, input.userId))
					.returning();

				if (!result[0]) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User not found",
					});
				}

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to promote user to admin",
					cause: error,
				});
			}
		}),

	// Admin: Demote admin to user
	demoteFromAdmin: protectedProcedure
		.input(z.object({ userId: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "admin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Admin access required",
				});
			}

			// Prevent admin from demoting themselves
			if (input.userId === ctx.session.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot demote yourself",
				});
			}

			try {
				const result = await ctx.db
					.update(users)
					.set({
						role: "user",
						updatedAt: new Date(),
					})
					.where(eq(users.id, input.userId))
					.returning();

				if (!result[0]) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User not found",
					});
				}

				return result[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to demote admin to user",
					cause: error,
				});
			}
		}),
});
