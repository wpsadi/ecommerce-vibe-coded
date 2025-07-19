import type { DefaultSession, NextAuthConfig } from "next-auth";

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
		// Temporarily disable providers for development
		// Will re-enable once database is properly configured
	],
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
				id: token.sub || "anonymous",
				role: (token.role as string) || "user",
			},
		}),
		jwt: ({ token, user }) => {
			if (user) {
				token.role = user.role;
			}
			return token;
		},
	},
} satisfies NextAuthConfig;