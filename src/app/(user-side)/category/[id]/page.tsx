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
import { type Product, categories, mockProducts } from "@/lib/mock-data";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CategoryPage() {
	const params = useParams();
	const categoryId = params.id as string;

	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [sortBy, setSortBy] = useState("relevance");

	const category = categories.find((c) => c.id === categoryId);
	const categoryName = category?.name || "Category";

	useEffect(() => {
		setLoading(true);

		setTimeout(() => {
			// Filter by categoryId instead of category name for better accuracy
			const filtered = mockProducts.filter(
				(product) => product.categoryId === categoryId,
			);

			// Sort products
			switch (sortBy) {
				case "price-low":
					filtered.sort((a, b) => a.price - b.price);
					break;
				case "price-high":
					filtered.sort((a, b) => b.price - a.price);
					break;
				case "rating":
					filtered.sort((a, b) => b.rating - a.rating);
					break;
				case "newest":
					filtered.sort(
						(a, b) => Number.parseInt(b.id) - Number.parseInt(a.id),
					);
					break;
				default:
					// relevance - keep original order
					break;
			}

			setProducts(filtered);
			setLoading(false);
		}, 500);
	}, [categoryId, sortBy]);

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
								<span className="text-4xl">{category.icon}</span>
								{category.name}
							</h1>
							<p className="mt-2 text-muted-foreground">
								{loading
									? "Loading..."
									: `${products.length} products available`}
							</p>
						</div>

						<Select value={sortBy} onValueChange={setSortBy}>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="relevance">Relevance</SelectItem>
								<SelectItem value="price-low">Price: Low to High</SelectItem>
								<SelectItem value="price-high">Price: High to Low</SelectItem>
								<SelectItem value="rating">Customer Rating</SelectItem>
								<SelectItem value="newest">Newest First</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Products Grid */}
				{loading ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<ProductSkeleton key={`category-product-skeleton-${i}`} />
						))}
					</div>
				) : products.length === 0 ? (
					<div className="py-12 text-center">
						<div className="mb-4 text-6xl">{category.icon}</div>
						<h2 className="mb-2 font-bold text-2xl">No products available</h2>
						<p className="text-muted-foreground">
							We don't have any products in this category yet. Check back soon!
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{products.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				)}
			</main>
		</div>
	);
}
