"use client";

import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { ProductSkeleton } from "@/components/product-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/trpc/react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
	const { data: featuredProducts, isPending: productsLoading } =
		api.products.getAll.useQuery({ featured: true, limit: 8 });
	const { data: featuredCategories, isPending: categoriesLoading } =
		api.categories.getFeatured.useQuery();

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main>
				{/* Hero Section */}
				<section className="flipkart-gradient py-16 text-white">
					<div className="container mx-auto px-4 text-center">
						<h1 className="mb-4 font-bold text-4xl md:text-6xl">
							Welcome to Ecommerce
						</h1>
						<p className="mb-8 text-xl opacity-90">
							Discover amazing products at unbeatable prices
						</p>
						<Link href="/categories">
							<Button size="lg" variant="secondary">
								Shop Now
							</Button>
						</Link>
					</div>
				</section>

				{/* Featured Categories */}
				<section className="py-12">
					<div className="container mx-auto px-4">
						<h2 className="mb-8 font-bold text-2xl">Featured Categories</h2>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
							{categoriesLoading
								? Array.from({ length: 6 }).map((_, i) => (
										<Card key={`category-skeleton-${i}`}>
											<CardContent className="p-6 text-center">
												<div className="mx-auto mb-2 h-16 w-16 animate-pulse rounded-lg bg-muted" />
												<div className="mx-auto h-4 w-20 animate-pulse rounded bg-muted" />
											</CardContent>
										</Card>
									))
								: featuredCategories?.map((category) => (
										<Link key={category.id} href={`/category/${category.slug}`}>
											<Card className="cursor-pointer transition-shadow hover:shadow-md">
												<CardContent className="p-6 text-center">
													{category.image ? (
														<div className="mx-auto mb-2 h-16 w-16 overflow-hidden rounded-lg">
															<Image
																src={category.image || "/placeholder.svg"}
																alt={category.name}
																width={64}
																height={64}
																className="h-full w-full object-cover"
															/>
														</div>
													) : (
														<div className="mb-2 text-3xl">{category.icon}</div>
													)}
													<h3 className="font-medium text-sm">
														{category.name}
													</h3>
												</CardContent>
											</Card>
										</Link>
									))}
						</div>

						{/* Show all categories link */}
						<div className="mt-6 text-center">
							<Link href="/categories">
								<Button variant="outline">View All Categories</Button>
							</Link>
						</div>
					</div>
				</section>

				{/* Featured Products */}
				<section className="bg-muted/50 py-12">
					<div className="container mx-auto px-4">
						<div className="mb-8 flex items-center justify-between">
							<h2 className="font-bold text-2xl">Featured Products</h2>
							<Link href="/products">
								<Button variant="outline">View All</Button>
							</Link>
						</div>

						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{productsLoading
								? Array.from({ length: 8 }).map((_, i) => (
										<ProductSkeleton key={`product-skeleton-${i}`} />
									))
								: featuredProducts?.map((product) => (
										<ProductCard
											key={product.id}
											product={{
												...product,
												originalPrice: product.originalPrice || undefined,
											}}
										/>
									))}
						</div>
					</div>
				</section>

				{/* Features */}
				<section className="py-12">
					<div className="container mx-auto px-4">
						<div className="grid gap-8 md:grid-cols-3">
							<div className="text-center">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
									<span className="text-2xl">🚚</span>
								</div>
								<h3 className="mb-2 font-semibold">Free Delivery</h3>
								<p className="text-muted-foreground">
									Free delivery on orders above ₹499
								</p>
							</div>
							<div className="text-center">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
									<span className="text-2xl">🔒</span>
								</div>
								<h3 className="mb-2 font-semibold">Secure Payment</h3>
								<p className="text-muted-foreground">
									100% secure payment methods
								</p>
							</div>
							<div className="text-center">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
									<span className="text-2xl">↩️</span>
								</div>
								<h3 className="mb-2 font-semibold">Easy Returns</h3>
								<p className="text-muted-foreground">7-day return policy</p>
							</div>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
