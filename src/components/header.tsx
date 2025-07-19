"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useCartSummary, useWishlistCount } from "@/hooks/use-trpc-hooks";
import {
	Heart,
	Menu,
	Moon,
	Search,
	ShoppingCart,
	Sun,
	User,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Header() {
	const [searchQuery, setSearchQuery] = useState("");
	const [mounted, setMounted] = useState(false);
	const router = useRouter();
	const { user, logout } = useAuth();

	// tRPC Hooks for cart and wishlist counts
	const { data: cartCount } = useCartSummary();
	const { data: wishlistCount } = useWishlistCount();

	const { theme, setTheme } = useTheme();

	// Ensure component is mounted before rendering theme-dependent content
	useEffect(() => {
		setMounted(true);
	}, []);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	};

	const handleLogout = () => {
		logout();
		router.push("/");
	};

	const toggleTheme = () => {
		setTheme(theme === "dark" ? "light" : "dark");
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link href="/" className="flex items-center space-x-2">
						<div className="flipkart-gradient rounded px-3 py-1 font-bold text-white text-xl">
							Ecommerce
						</div>
					</Link>

					{/* Search Bar */}
					<form
						onSubmit={handleSearch}
						className="mx-8 hidden max-w-md flex-1 md:flex"
					>
						<div className="relative w-full">
							<Input
								type="text"
								placeholder="Search for products, brands and more"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pr-10"
							/>
							<Button
								type="submit"
								size="sm"
								className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 p-0"
							>
								<Search className="h-4 w-4" />
							</Button>
						</div>
					</form>

					{/* Navigation */}
					<div className="flex items-center space-x-4">
						{/* Theme Toggle */}
						{mounted && (
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleTheme}
								className="theme-toggle"
							>
								<Sun className="sun-icon dark:-rotate-90 h-4 w-4 rotate-0 scale-100 transition-all dark:scale-0" />
								<Moon className="moon-icon h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
								<span className="sr-only">Toggle theme</span>
							</Button>
						)}

						{user ? (
							<>
								{/* Wishlist */}
								<Link href="/wishlist">
									<Button variant="ghost" size="sm" className="relative">
										<Heart className="h-5 w-5" />
										{wishlistCount && wishlistCount.count > 0 && (
											<Badge className="-top-2 -right-2 absolute h-5 w-5 rounded-full p-0 text-xs">
												{wishlistCount.count}
											</Badge>
										)}
									</Button>
								</Link>

								{/* Cart */}
								<Link href="/cart">
									<Button variant="ghost" size="sm" className="relative">
										<ShoppingCart className="h-5 w-5" />
										{cartCount && cartCount.totalItems > 0 && (
											<Badge className="-top-2 -right-2 absolute h-5 w-5 rounded-full p-0 text-xs">
												{cartCount.totalItems}
											</Badge>
										)}
									</Button>
								</Link>

								{/* User Menu */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm">
											<User className="h-5 w-5" />
											<span className="ml-2 hidden md:inline">{user.name}</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem asChild>
											<Link href="/profile">Profile</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link href="/orders">My Orders</Link>
										</DropdownMenuItem>
										{user.role === "admin" && (
											<>
												<DropdownMenuSeparator />
												<DropdownMenuItem asChild>
													<Link href="/admin">Admin Dashboard</Link>
												</DropdownMenuItem>
											</>
										)}
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={handleLogout}>
											Logout
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						) : (
							<div className="flex items-center space-x-2">
								<Link href="/login">
									<Button variant="ghost" size="sm">
										Login
									</Button>
								</Link>
								<Link href="/signup">
									<Button size="sm">Sign Up</Button>
								</Link>
							</div>
						)}

						{/* Mobile Menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="md:hidden">
									<Menu className="h-5 w-5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem asChild>
									<Link href="/categories">Categories</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link href="/search">Search</Link>
								</DropdownMenuItem>
								{user && (
									<>
										<DropdownMenuItem asChild>
											<Link href="/wishlist">Wishlist</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link href="/cart">Cart</Link>
										</DropdownMenuItem>
									</>
								)}
								{mounted && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={toggleTheme}>
											<div className="flex items-center gap-2">
												{theme === "dark" ? (
													<Sun className="h-4 w-4" />
												) : (
													<Moon className="h-4 w-4" />
												)}
												{theme === "dark" ? "Light Mode" : "Dark Mode"}
											</div>
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</header>
	);
}
