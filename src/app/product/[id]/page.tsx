"use client";

import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import {
	useAddToCart,
	useProductWithDetails,
	useWishlistToggle,
} from "@/hooks/use-trpc-hooks";
import {
	Heart,
	RotateCcw,
	Shield,
	ShoppingCart,
	Star,
	Truck,
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ProductPage() {
	const params = useParams();
	const { product, images, reviews, isPending, error } = useProductWithDetails(
		params.id as string,
	);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const [quantity, setQuantity] = useState(1);

	const addToCart = useAddToCart();
	const { toggle: toggleWishlist, isInWishlist } = useWishlistToggle(
		product?.id || "",
	);
	const { user } = useAuth();

	if (isPending) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="grid gap-8 md:grid-cols-2">
						<div className="space-y-4">
							<div className="aspect-square animate-pulse rounded-lg bg-muted" />
							<div className="flex gap-2">
								{Array.from({ length: 4 }).map((_, i) => (
									<div
										key={`skeleton-${i}`}
										className="h-20 w-20 animate-pulse rounded bg-muted"
									/>
								))}
							</div>
						</div>
						<div className="space-y-4">
							<div className="h-8 animate-pulse rounded bg-muted" />
							<div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
							<div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
							<div className="h-10 animate-pulse rounded bg-muted" />
						</div>
					</div>
				</main>
			</div>
		);
	}

	if (error || !product) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">Product Not Found</h1>
						<p className="text-muted-foreground">
							{error?.message ||
								"The product you're looking for doesn't exist."}
						</p>
					</div>
				</main>
			</div>
		);
	}

	const handleAddToCart = () => {
		if (!user) {
			toast.error("Please login to add items to cart");
			return;
		}
		addToCart.mutate({ productId: product.id, quantity });
	};

	const handleWishlistToggle = () => {
		if (!user) {
			toast.error("Please login to add items to wishlist");
			return;
		}
		toggleWishlist();
	};

	const discountPercentage = product.originalPrice
		? Math.round(
			((Number(product.originalPrice) - Number(product.price)) /
				Number(product.originalPrice)) *
			100,
		)
		: 0;

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<div className="grid gap-8 md:grid-cols-2">
					{/* Product Images */}
					<div className="space-y-4">
						<div className="aspect-square overflow-hidden rounded-lg border">
							<Image
								src={images?.[selectedImageIndex]?.url || "/placeholder.svg"}
								alt={product.name}
								width={600}
								height={600}
								className="h-full w-full object-cover"
							/>
						</div>

						{/* Thumbnail images */}
						<div className="flex gap-2 overflow-x-auto">
							{images?.map((image, i) => (
								<button
									type="button"
									key={image.id}
									className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded border ${selectedImageIndex === i
											? "border-primary ring-2 ring-primary"
											: "border-border"
										}`}
									onClick={() => setSelectedImageIndex(i)}
								>
									<Image
										src={image.url || "/placeholder.svg"}
										alt={`${product.name} view ${i + 1}`}
										width={80}
										height={80}
										className="h-full w-full object-cover"
									/>
								</button>
							))}
						</div>
					</div>

					{/* Product Details */}
					<div className="space-y-6">
						<div>
							<h1 className="mb-2 font-bold text-2xl md:text-3xl">
								{product.name}
							</h1>
							<div className="mb-4 flex items-center gap-2">
								<div className="flex items-center">
									<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
									<span className="ml-1 font-medium">
										{reviews?.averageRating || 0}
									</span>
								</div>
								<span className="text-muted-foreground">
									({reviews?.totalReviews || 0} reviews)
								</span>
							</div>
						</div>

						{/* Price */}
						<div className="flex items-center gap-4">
							<span className="font-bold text-3xl">
								₹{Number(product.price).toLocaleString()}
							</span>
							{product.originalPrice && (
								<>
									<span className="text-muted-foreground text-xl line-through">
										₹{Number(product.originalPrice).toLocaleString()}
									</span>
									<Badge className="bg-green-500 hover:bg-green-600">
										{discountPercentage}% OFF
									</Badge>
								</>
							)}
						</div>

						{/* Stock Status */}
						<div>
							{product.stock > 0 ? (
								<span className="font-medium text-green-600">
									In Stock ({product.stock} available)
								</span>
							) : (
								<span className="font-medium text-red-600">Out of Stock</span>
							)}
						</div>

						{/* Quantity Selector */}
						<div className="flex items-center gap-4">
							<Label htmlFor="quantity" className="font-medium">
								Quantity:
							</Label>
							<div className="flex items-center rounded border">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setQuantity(Math.max(1, quantity - 1))}
									disabled={quantity <= 1}
								>
									-
								</Button>
								<Input
									id="quantity"
									type="number"
									value={quantity}
									readOnly
									className="min-w-[3rem] border-none px-4 py-2 text-center focus:ring-0"
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() =>
										setQuantity(Math.min(product.stock, quantity + 1))
									}
									disabled={quantity >= product.stock}
								>
									+
								</Button>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-4">
							<Button
								onClick={handleAddToCart}
								className="flex-1"
								disabled={product.stock === 0 || addToCart.isPending}
							>
								<ShoppingCart className="mr-2 h-4 w-4" />
								{addToCart.isPending ? "Adding..." : "Add to Cart"}
							</Button>
							<Button
								variant="outline"
								onClick={handleWishlistToggle}
								disabled={toggleWishlist.isPending}
							>
								<Heart
									className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`}
								/>
							</Button>
						</div>

						{/* Features */}
						<div className="grid grid-cols-3 gap-4 py-4">
							<div className="text-center">
								<Truck className="mx-auto mb-2 h-6 w-6 text-primary" />
								<p className="text-sm">Free Delivery</p>
							</div>
							<div className="text-center">
								<RotateCcw className="mx-auto mb-2 h-6 w-6 text-primary" />
								<p className="text-sm">7 Day Return</p>
							</div>
							<div className="text-center">
								<Shield className="mx-auto mb-2 h-6 w-6 text-primary" />
								<p className="text-sm">Warranty</p>
							</div>
						</div>

						<Separator />

						{/* Description */}
						<div>
							<h3 className="mb-2 font-semibold">Description</h3>
							<p className="text-muted-foreground">{product.description}</p>
						</div>

						{/* Specifications */}
						{product.specifications &&
							Object.keys(product.specifications).length > 0 && (
								<div>
									<h3 className="mb-4 font-semibold">Specifications</h3>
									<Card>
										<CardContent className="p-4">
											<div className="space-y-2">
												{Object.entries(product.specifications).map(
													([key, value]) => (
														<div
															key={key}
															className="flex justify-between py-1"
														>
															<span className="font-medium">{key}:</span>
															<span className="text-muted-foreground">
																{value}
															</span>
														</div>
													),
												)}
											</div>
										</CardContent>
									</Card>
								</div>
							)}
					</div>
				</div>
			</main>
		</div>
	);
}
