import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/server/db/schema";

const DATABASE_URL = process.env.DATABASE_URL || "file:./db.sqlite";
const conn = new Database(DATABASE_URL.replace("file:", ""));
const db = drizzle(conn, { schema });

async function main() {
	console.log("Seeding database...");

	try {
		// Try to query users table to see if schema exists
		const users = db.select().from(schema.users).limit(1);
		await users;
		console.log("Schema exists, ready for seeding");
	} catch (error) {
		console.error("Schema error:", error);
		console.log("Please run: npm run db:push");
		process.exit(1);
	}

	console.log("Database seeded successfully!");
}

main().catch((error) => {
	console.error("Seeding failed:", error);
	process.exit(1);
});
