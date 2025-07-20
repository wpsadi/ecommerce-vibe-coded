import type { Config } from "drizzle-kit";

import { env } from "@/env";

export default {
	schema: "./src/server/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: "dev.db",
	},
	tablesFilter: ["ecommerce_*"],
} satisfies Config;
