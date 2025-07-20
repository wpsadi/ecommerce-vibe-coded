import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare } from "bcryptjs";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";

import { db } from "@/server/db";
import {
	accounts,
	sessions,
	users,
	verificationTokens,
} from "@/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			role: string;
		} & DefaultSession["user"];
	}

	interface User {
		role: string;
	}
}

declare module "@auth/core/adapters" {
	interface AdapterUser {
		role: string;
	}
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials.password) {
					return null;
				}

				const user = await db.query.users.findFirst({
					where: (users, { eq }) => eq(users.email, String(credentials.email)),
					columns: {
						id: true,
						name: true,
						email: true,
						role: true,
						password: true,
					},
				});

				if (
					!user ||
					!user.password ||
					!(await compare(String(credentials.password), user.password))
				) {
					return null;
				}

				return {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				};
			},
		}),
	],
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens,
	}),
	session: {
		strategy: "jwt" as const,
	},
	pages: {
		signIn: "/login",
	},
	callbacks: {
		session: ({ session, token }) => ({
			...session,
			user: {
				...session.user,
				id: token.sub!,
				role: token.role as string,
			},
		}),
		jwt: ({ token, user }) => {
			console.log("NextAuth JWT Callback - Token:", token);
			console.log("NextAuth JWT Callback - User:", user);

			if (user) {
				token.role = user.role;
			}
			return token;
		},
	},
} satisfies NextAuthConfig;
