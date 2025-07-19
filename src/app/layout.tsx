import type { Metadata } from "next";
import type React from "react";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { TRPCReactProvider } from "@/trpc/react";

import SessionWrapper from "@/components/session-wrapper";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "Ecommerce MVP",
	description: "E-commerce platform with user and admin features",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="font-sans antialiased">
				<TRPCReactProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange={false}
						storageKey="ecommerce-theme"
					>
						<SessionWrapper>
							<AuthProvider>
								<CartProvider>
									<WishlistProvider>
										{children}
										<Toaster />
									</WishlistProvider>
								</CartProvider>
							</AuthProvider>
						</SessionWrapper>
					</ThemeProvider>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
