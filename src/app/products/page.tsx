"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useAddToCart,
	useAddToWishlist,
	useCategories,
	useIsInWishlist,
	useProductImages,
	useProducts,
	useRemoveFromWishlistByProductId,
} from "@/hooks/use-trpc-hooks";
import { cn } from "@/lib/utils";
import {
	Filter,
	Grid,
	Heart,
	List,
	Search,
	ShoppingCart,
	Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { Product as DBProduct } from "@/server/db/schema";

type Product = DBProduct & {
	primaryImage?: string;
	averageRating?: number;
	reviewCount?: number;
};

type ViewMode = "grid" | "list";

export default function ProductsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [search, setSearch] = useState(searchParams?.get("search") || "");
	const [selectedCategory, setSelectedCategory] = useState(
		searchParams?.get("category") || "",
	);
	const [sortBy, setSortBy] = useState<
		"name" | "price" | "created_at" | "rating"
	>("created_at");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [viewMode, setViewMode] = useState<ViewMode>("grid");

	// tRPC Hooks
	const {
		data: products,
		isPending: productsLoading,
		error,
	} = useProducts({
		categoryId: selectedCategory || undefined,
		search: search || undefined,
		sortBy,
		sortOrder,
		limit: 24,
	});

	const { data: categories } = useCategories();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (selectedCategory) params.set("category", selectedCategory);
		router.push(`/products?${params.toString()}`);
	};

	const handleCategoryChange = (categoryId: string) => {
		setSelectedCategory(categoryId);
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (categoryId) params.set("category", categoryId);
		router.push(`/products?${params.toString()}`);
	};

	const handleSortChange = (value: string) => {
		const [newSortBy, newSortOrder] = value.split("-") as [
			typeof sortBy,
			typeof sortOrder,
		];
		setSortBy(newSortBy);
		setSortOrder(newSortOrder);
	};

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="text-center">
					<h2 className="mb-2 font-bold text-2xl">Error loading products</h2>
					<p className="mb-4 text-gray-600">{error.message}</p>
					<Button onClick={() => window.location.reload()}>Try Again</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<div className="flex flex-col gap-8 lg:flex-row">
					{/* Filters Sidebar */}
					<div className="flex-shrink-0 lg:w-64">
						<Card className="sticky top-4">
							<div className="space-y-6 p-6">
								<div className="flex items-center gap-2">
									<Filter className="h-5 w-5" />
									<h2 className="font-semibold">Filters</h2>
								</div>

								{/* Search */}
								<form onSubmit={handleSearch}>
									<div className="relative">
										<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
										<Input
											placeholder="Search products..."
											value={search}
											onChange={(e) => setSearch(e.target.value)}
											className="pl-10"
										/>
									</div>
								</form>

								{/* Categories */}
								<div>
									<h3 className="mb-3 font-medium">Categories</h3>
									<div className="space-y-2">
										<Button
											variant={!selectedCategory ? "default" : "ghost"}
											className="w-full justify-start"
											onClick={() => handleCategoryChange("")}
										>
											All Categories
										</Button>
										{categories?.map((category) => (
											<Button
												key={category.id}
												variant={
													selectedCategory === category.id ? "default" : "ghost"
												}
												className="w-full justify-between text-left"
												onClick={() => handleCategoryChange(category.id)}
											>
												<span className="flex items-center gap-2">
													<span>{category.icon}</span>
													{category.name}
												</span>
												<Badge variant="secondary">
													{category.productCount}
												</Badge>
											</Button>
										))}
									</div>
								</div>
							</div>
						</Card>
					</div>

					{/* Products Grid */}
					<div className="flex-1">
						<div className="mb-6 flex items-center justify-between">
							<div>
								<h1 className="font-bold text-3xl">
									{selectedCategory
										? categories?.find((c) => c.id === selectedCategory)?.name
										: "All Products"}
								</h1>
								<p className="mt-1 text-gray-600">
									{products?.length || 0} products found
								</p>
							</div>

							<div className="flex items-center gap-4">
								{/* Sort */}
								<Select
									value={`${sortBy}-${sortOrder}`}
									onValueChange={handleSortChange}
								>
									<SelectTrigger className="w-48">
										<SelectValue placeholder="Sort by" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="created_at-desc">
											Newest First
										</SelectItem>
										<SelectItem value="created_at-asc">Oldest First</SelectItem>
										<SelectItem value="name-asc">Name A-Z</SelectItem>
										<SelectItem value="name-desc">Name Z-A</SelectItem>
										<SelectItem value="price-asc">Price Low to High</SelectItem>
										<SelectItem value="price-desc">
											Price High to Low
										</SelectItem>
										<SelectItem value="rating-desc">Highest Rated</SelectItem>
									</SelectContent>
								</Select>

								{/* View Mode */}
								<div className="flex rounded-lg border">
									<Button
										variant={viewMode === "grid" ? "default" : "ghost"}
										size="sm"
										onClick={() => setViewMode("grid")}
									>
										<Grid className="h-4 w-4" />
									</Button>
									<Button
										variant={viewMode === "list" ? "default" : "ghost"}
										size="sm"
										onClick={() => setViewMode("list")}
									>
										<List className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>

						{/* Loading State */}
						{productsLoading && (
							<div
								className={cn(
									viewMode === "grid"
										? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
										: "space-y-4",
								)}
							>
								{[...Array(8)].map((_, i) => (
									<ProductSkeleton
										key={`product-skeleton-${i}`}
										viewMode={viewMode}
									/>
								))}
							</div>
						)}

						{/* Products */}
						{!productsLoading && products && products.length > 0 && (
							<div
								className={cn(
									viewMode === "grid"
										? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
										: "space-y-4",
								)}
							>
								{products.map((product) => (
									<ProductCard
										key={product.id}
										product={product}
										viewMode={viewMode}
									/>
								))}
							</div>
						)}

						{/* Empty State */}
						{!productsLoading && (!products || products.length === 0) && (
							<div className="py-16 text-center">
								<div className="mb-4 text-6xl">🔍</div>
								<h3 className="mb-2 font-medium text-lg">No products found</h3>
								<p className="mb-6 text-gray-600">
									Try adjusting your search or filter criteria
								</p>
								<Button
									onClick={() => {
										setSearch("");
										setSelectedCategory("");
										router.push("/products");
									}}
								>
									Clear Filters
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function ProductCard({
	product,
	viewMode,
}: {
	product: Product;
	viewMode: ViewMode;
}) {
	const addToCart = useAddToCart();
	const addToWishlist = useAddToWishlist();
	const removeFromWishlist = useRemoveFromWishlistByProductId();
	const { data: isInWishlist } = useIsInWishlist(product.id);

	const handleAddToCart = async (e: React.MouseEvent) => {
		e.preventDefault();
		try {
			await addToCart.mutateAsync({
				productId: product.id,
				quantity: 1,
			});
			toast.success("Added to cart!");
		} catch (error) {
			toast.error("Failed to add to cart");
		}
	};

	const handleToggleWishlist = async (e: React.MouseEvent) => {
		e.preventDefault();
		try {
			if (isInWishlist?.isInWishlist) {
				await removeFromWishlist.mutateAsync({ productId: product.id });
				toast.success("Removed from wishlist");
			} else {
				await addToWishlist.mutateAsync({ productId: product.id });
				toast.success("Added to wishlist!");
			}
		} catch (error) {
			toast.error("Failed to update wishlist");
		}
	};

	const discountPercentage = product.originalPrice
		? Math.round(
			((Number(product.originalPrice) - Number(product.price)) /
				Number(product.originalPrice)) *
			100,
		)
		: 0;

	if (viewMode === "list") {
		return (
			<Card className="overflow-hidden">
				<div className="flex">
					<div className="relative h-48 w-48 flex-shrink-0">
						<Link href={`/product/${product.id}`}>
							<Image
								src={primaryImage || "/placeholder-product.jpg"}
								alt={product.name}
								fill
								className="object-cover"
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							/>
						</Link>
						{discountPercentage > 0 && (
							<Badge className="absolute top-2 left-2 bg-red-500">
								-{discountPercentage}%
							</Badge>
						)}
					</div>

					<div className="flex-1 p-6">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<Link href={`/product/${product.id}`}>
									<h3 className="mb-2 font-semibold text-lg transition-colors hover:text-primary">
										{product.name}
									</h3>
								</Link>

								<div className="mb-2 flex items-center gap-2">
									<div className="flex items-center">
										{[...Array(5)].map((_, i) => (
											<Star
												key={`star-${i}`}
												className={cn(
													"h-4 w-4",
													i < Math.floor(product.averageRating || 0)
														? "fill-yellow-400 text-yellow-400"
														: "text-gray-300",
												)}
											/>
										))}
									</div>
									<span className="text-gray-600 text-sm">
										({product.reviewCount || 0} reviews)
									</span>
								</div>

								<div className="mb-4 flex items-center gap-3">
									<span className="font-bold text-2xl">
										₹{Number(product.price).toLocaleString()}
									</span>
									{product.originalPrice && (
										<span className="text-gray-500 text-lg line-through">
											₹{Number(product.originalPrice).toLocaleString()}
										</span>
									)}
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="icon"
									onClick={handleToggleWishlist}
									disabled={
										addToWishlist.isPending || removeFromWishlist.isPending
									}
								>
									<Heart
										className={cn(
											"h-4 w-4",
											isInWishlist?.isInWishlist && "fill-red-500 text-red-500",
										)}
									/>
								</Button>

								<Button
									onClick={handleAddToCart}
									disabled={product.stock === 0 || addToCart.isPending}
									className="min-w-32"
								>
									<ShoppingCart className="mr-2 h-4 w-4" />
									{addToCart.isPending ? "Adding..." : "Add to Cart"}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</Card>
		);
	}

	return (
		<Card className="group overflow-hidden">
			<div className="relative aspect-square overflow-hidden">
				<Link href={`/product/${product.id}`}>
					<Image
						src={product.primaryImage || "/placeholder-product.jpg"}
						alt={product.name}
						fill
						className="object-cover transition-transform group-hover:scale-105"
					/>
				</Link>

				{discountPercentage > 0 && (
					<Badge className="absolute top-2 left-2 bg-red-500">
						-{discountPercentage}%
					</Badge>
				)}

				{product.stock === 0 && (
					<Badge variant="secondary" className="absolute top-2 right-2">
						Out of Stock
					</Badge>
				)}

				<Button
					variant="ghost"
					size="icon"
					className="absolute right-2 bottom-2 bg-white/80 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
					onClick={handleToggleWishlist}
					disabled={addToWishlist.isPending || removeFromWishlist.isPending}
				>
					<Heart
						className={cn(
							"h-4 w-4",
							isInWishlist?.isInWishlist && "fill-red-500 text-red-500",
						)}
					/>
				</Button>
			</div>

			<CardContent className="p-4">
				<Link href={`/product/${product.id}`}>
					<h3 className="mb-2 line-clamp-2 font-medium transition-colors hover:text-primary">
						{product.name}
					</h3>
				</Link>

				<div className="mb-2 flex items-center gap-1">
					<div className="flex items-center">
						{[...Array(5)].map((_, i) => (
							<Star
								key={`star-${i}`}
								className={cn(
									"h-3 w-3",
									i < Math.floor(product.averageRating || 0)
										? "fill-yellow-400 text-yellow-400"
										: "text-gray-300",
								)}
							/>
						))}
					</div>
					<span className="text-gray-600 text-sm">
						({product.reviewCount || 0})
					</span>
				</div>

				<div className="mb-3 flex items-center gap-2">
					<span className="font-bold">
						₹{Number(product.price).toLocaleString()}
					</span>
					{product.originalPrice && (
						<span className="text-gray-500 text-sm line-through">
							₹{Number(product.originalPrice).toLocaleString()}
						</span>
					)}
				</div>

				<Button
					className="w-full"
					onClick={handleAddToCart}
					disabled={product.stock === 0 || addToCart.isPending}
				>
					<ShoppingCart className="mr-2 h-4 w-4" />
					{addToCart.isPending
						? "Adding..."
						: product.stock === 0
							? "Out of Stock"
							: "Add to Cart"}
				</Button>
			</CardContent>
		</Card>
	);
}

function ProductSkeleton({ viewMode }: { viewMode: ViewMode }) {
	if (viewMode === "list") {
		return (
			<Card>
				<div className="flex">
					<Skeleton className="h-48 w-48" />
					<div className="flex-1 p-6">
						<Skeleton className="mb-2 h-6 w-3/4" />
						<Skeleton className="mb-2 h-4 w-1/2" />
						<Skeleton className="mb-4 h-8 w-32" />
						<div className="flex gap-2">
							<Skeleton className="h-10 w-10" />
							<Skeleton className="h-10 w-32" />
						</div>
					</div>
				</div>
			</Card>
		);
	}

	return (
		<Card>
			<Skeleton className="aspect-square" />
			<div className="p-4">
				<Skeleton className="mb-2 h-4 w-full" />
				<Skeleton className="mb-2 h-4 w-3/4" />
				<Skeleton className="mb-3 h-6 w-1/2" />
				<Skeleton className="h-10 w-full" />
			</div>
		</Card>
	);
}
