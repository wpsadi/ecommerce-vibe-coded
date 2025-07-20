"use client";

import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { ProductSkeleton } from "@/components/product-skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCategory, useProducts } from "@/hooks/use-trpc-hooks";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function CategoryPage() {
	const params = useParams();
	const categoryId = params.id as string;

	const [sortBy, setSortBy] = useState<"name" | "price" | "created_at" | "rating">("created_at");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	const { data: category, isPending: categoryLoading } = useCategory(categoryId);
	const { data: products, isPending: productsLoading } = useProducts({
		categoryId,
		sortBy,
		sortOrder,
		limit: 50,
	});

	const handleSortChange = (value: string) => {
		switch (value) {
			case "price-low":
				setSortBy("price");
				setSortOrder("asc");
				break;
			case "price-high":
				setSortBy("price");
				setSortOrder("desc");
				break;
			case "rating":
				setSortBy("rating");
				setSortOrder("desc");
				break;
			case "newest":
				setSortBy("created_at");
				setSortOrder("desc");
				break;
			case "name":
				setSortBy("name");
				setSortOrder("asc");
				break;
			default:
				setSortBy("created_at");
				setSortOrder("desc");
		}
	};

	const loading = categoryLoading || productsLoading;

	if (categoryLoading) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">Loading...</h1>
					</div>
				</main>
			</div>
		);
	}

	if (!category) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">Category Not Found</h1>
						<p className="text-muted-foreground">
							The category you're looking for doesn't exist.
						</p>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				{/* Category Header */}
				<div className="mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="flex items-center gap-3 font-bold text-3xl">
								{category.icon && <span className="text-4xl">{category.icon}</span>}
								{category.name}
							</h1>
							<p className="mt-2 text-muted-foreground">
								{loading
									? "Loading..."
									: `${products?.length || 0} products available`}
							</p>
						</div>

						<Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="created_at-desc">Newest First</SelectItem>
								<SelectItem value="price-asc">Price: Low to High</SelectItem>
								<SelectItem value="price-desc">Price: High to Low</SelectItem>
								<SelectItem value="rating-desc">Customer Rating</SelectItem>
								<SelectItem value="name-asc">Name A-Z</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Products Grid */}
				{productsLoading ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<ProductSkeleton key={`category-product-skeleton-${i}`} />
						))}
					</div>
				) : !products || products.length === 0 ? (
					<div className="py-12 text-center">
						{category.icon && <div className="mb-4 text-6xl">{category.icon}</div>}
						<h2 className="mb-2 font-bold text-2xl">No products available</h2>
						<p className="text-muted-foreground">
							We don't have any products in this category yet. Check back soon!
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{products.map((product) => (
							<ProductCard 
								key={product.id} 
								product={{
									id: product.id,
									name: product.name,
									price: Number(product.price),
									originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
									image: product.primaryImage || product.images?.[0]?.url || "/placeholder-product.jpg",
									rating: product.averageRating || 0,
									category: product.category?.name || "",
									stock: product.stock,
								}} 
							/>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
