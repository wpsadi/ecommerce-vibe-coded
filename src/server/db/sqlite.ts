import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "@/env";

// Create SQLite database for development/testing
const sqlite = new Database("dev.db");
export const db = drizzle(sqlite);

// Mock session context for testing
export const createMockContext = () => ({
	db,
	session: {
		user: {
			id: "test-user",
			role: "admin",
			email: "test@example.com",
		},
	},
});