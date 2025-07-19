"use client";

import type React from "react";

import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { ProductSkeleton } from "@/components/product-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { type Product, categories, mockProducts } from "@/lib/mock-data";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchPage() {
	const searchParams = useSearchParams();
	const initialQuery = searchParams.get("q") || "";

	const [searchQuery, setSearchQuery] = useState(initialQuery);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [sortBy, setSortBy] = useState("relevance");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [priceRange, setPriceRange] = useState([0, 200000]);
	const [showFilters, setShowFilters] = useState(false);

	useEffect(() => {
		setLoading(true);

		// Simulate API call
		setTimeout(() => {
			let filtered = mockProducts;

			// Search filter
			if (searchQuery) {
				filtered = filtered.filter(
					(product) =>
						product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						product.description
							.toLowerCase()
							.includes(searchQuery.toLowerCase()) ||
						product.category.toLowerCase().includes(searchQuery.toLowerCase()),
				);
			}

			// Category filter
			if (selectedCategories.length > 0) {
				filtered = filtered.filter((product) =>
					selectedCategories.includes(product.category),
				);
			}

			// Price filter
			filtered = filtered.filter(
				(product) =>
					Number(product?.price || 0) >= (priceRange?.[0] ?? 0) &&
					Number(product?.price || 0) <= (priceRange?.[1] ?? 10000),
			);

			// Sort
			switch (sortBy) {
				case "price-low":
					filtered.sort(
						(a, b) => Number(a?.price || 0) - Number(b?.price || 0),
					);
					break;
				case "price-high":
					filtered.sort(
						(a, b) => Number(b?.price || 0) - Number(a?.price || 0),
					);
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
	}, [searchQuery, sortBy, selectedCategories, priceRange]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		// Search is handled by useEffect
	};

	const handleCategoryChange = (category: string, checked: boolean) => {
		if (checked) {
			setSelectedCategories((prev) => [...prev, category]);
		} else {
			setSelectedCategories((prev) => prev.filter((c) => c !== category));
		}
	};

	const clearFilters = () => {
		setSelectedCategories([]);
		setPriceRange([0, 200000]);
		setSortBy("relevance");
	};

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				{/* Search Header */}
				<div className="mb-8">
					<form onSubmit={handleSearch} className="mb-4 flex gap-4">
						<div className="relative flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search for products..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Button type="submit">Search</Button>
					</form>

					<div className="flex items-center justify-between">
						<div>
							<h1 className="font-bold text-2xl">
								{searchQuery
									? `Search results for "${searchQuery}"`
									: "All Products"}
							</h1>
							<p className="text-muted-foreground">
								{loading ? "Searching..." : `${products.length} products found`}
							</p>
						</div>

						<div className="flex items-center gap-4">
							<Button
								variant="outline"
								onClick={() => setShowFilters(!showFilters)}
								className="md:hidden"
							>
								<SlidersHorizontal className="mr-2 h-4 w-4" />
								Filters
							</Button>

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
				</div>

				<div className="grid gap-8 lg:grid-cols-4">
					{/* Filters Sidebar */}
					<div
						className={`lg:block ${showFilters ? "block" : "hidden"} space-y-6`}
					>
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>Filters</CardTitle>
									<Button variant="ghost" size="sm" onClick={clearFilters}>
										Clear All
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Categories */}
								<div>
									<Label className="font-medium text-base">Categories</Label>
									<div className="mt-3 space-y-3">
										{categories.map((category) => (
											<div
												key={category.id}
												className="flex items-center space-x-2"
											>
												<Checkbox
													id={category.id}
													checked={selectedCategories.includes(category.name)}
													onCheckedChange={(checked) =>
														handleCategoryChange(
															category.name,
															checked as boolean,
														)
													}
												/>
												<Label
													htmlFor={category.id}
													className="cursor-pointer text-sm"
												>
													{category.name}
												</Label>
											</div>
										))}
									</div>
								</div>

								{/* Price Range */}
								<div>
									<Label className="font-medium text-base">Price Range</Label>
									<div className="mt-3 space-y-4">
										<Slider
											value={priceRange}
											onValueChange={setPriceRange}
											max={200000}
											min={0}
											step={1000}
											className="w-full"
										/>
										<div className="flex items-center justify-between text-muted-foreground text-sm">
											<span>₹{(priceRange?.[0] ?? 0).toLocaleString()}</span>
											<span>₹{(priceRange?.[1] ?? 10000).toLocaleString()}</span>
										</div>
									</div>
								</div>

								{/* Rating Filter */}
								<div>
									<Label className="font-medium text-base">
										Customer Rating
									</Label>
									<div className="mt-3 space-y-2">
										{[4, 3, 2, 1].map((rating) => (
											<div key={rating} className="flex items-center space-x-2">
												<Checkbox id={`rating-${rating}`} />
												<Label
													htmlFor={`rating-${rating}`}
													className="cursor-pointer text-sm"
												>
													{rating}★ & above
												</Label>
											</div>
										))}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Products Grid */}
					<div className="lg:col-span-3">
						{loading ? (
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{Array.from({ length: 9 }).map((_, i) => (
									<ProductSkeleton key={`search-skeleton-${i}`} />
								))}
							</div>
						) : products.length === 0 ? (
							<div className="py-12 text-center">
								<div className="mb-4 text-6xl">🔍</div>
								<h2 className="mb-2 font-bold text-2xl">No products found</h2>
								<p className="mb-4 text-muted-foreground">
									Try adjusting your search or filters to find what you're
									looking for.
								</p>
								<Button onClick={clearFilters}>Clear Filters</Button>
							</div>
						) : (
							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{products.map((product) => (
									<ProductCard key={product.id} product={product} />
								))}
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
