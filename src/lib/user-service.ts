import { db } from "@/server/db";
import { type NewUser, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Utility functions for user management
 * These can be used in server actions or API routes
 */

export async function createUser(userData: NewUser) {
	const result = await db.insert(users).values(userData).returning();
	return result[0];
}

export async function getUserByEmail(email: string) {
	const result = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	return result[0] || null;
}

export async function getUserById(id: string) {
	const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

	return result[0] || null;
}

export async function updateUserById(id: string, updates: Partial<NewUser>) {
	const result = await db
		.update(users)
		.set({ ...updates, updatedAt: new Date() })
		.where(eq(users.id, id))
		.returning();

	return result[0] || null;
}
