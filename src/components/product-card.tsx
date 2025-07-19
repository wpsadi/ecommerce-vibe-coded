"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import {
	useAddToCart,
	useAddToWishlist,
	useIsInWishlist,
	useRemoveFromWishlistByProductId,
} from "@/hooks/use-trpc-hooks";
import { cn } from "@/lib/utils";
import { Heart, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

interface ProductCardProps {
	product: {
		id: string;
		name: string;
		price: string | number;
		originalPrice?: string | number;
		primaryImage?: string;
		stock: number;
		averageRating?: number;
		reviewCount?: number;
		slug?: string;
	};
}

export function ProductCard({ product }: ProductCardProps) {
	const { user } = useAuth();

	// tRPC Hooks
	const addToCart = useAddToCart();
	const addToWishlist = useAddToWishlist();
	const removeFromWishlist = useRemoveFromWishlistByProductId();
	const { data: isInWishlist } = useIsInWishlist(product.id);

	const handleAddToCart = async () => {
		if (!user) {
			toast.error("Please login to add items to cart");
			return;
		}

		try {
			await addToCart.mutateAsync({
				productId: product.id,
				quantity: 1,
			});
			toast.success(`${product.name} has been added to your cart`);
		} catch (error) {
			toast.error("Failed to add item to cart");
		}
	};

	const handleWishlistToggle = async () => {
		if (!user) {
			toast.error("Please login to add items to wishlist");
			return;
		}

		try {
			if (isInWishlist?.isInWishlist) {
				await removeFromWishlist.mutateAsync({ productId: product.id });
				toast.success(`${product.name} has been removed from your wishlist`);
			} else {
				await addToWishlist.mutateAsync({ productId: product.id });
				toast.success(`${product.name} has been added to your wishlist`);
			}
		} catch (error) {
			toast.error("Failed to update wishlist");
		}
	};

	const discountPercentage = product.originalPrice
		? Math.round(
				((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100,
			)
		: 0;

	return (
		<Card className="group overflow-hidden transition-shadow hover:shadow-lg">
			<CardContent className="p-0">
				<div className="relative">
					<Link href={`/product/${product.id}`}>
						<div className="aspect-square overflow-hidden">
							<Image
								src={product.primaryImage || "/placeholder.svg"}
								alt={product.name}
								width={300}
								height={300}
								className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
						</div>
					</Link>

					{discountPercentage > 0 && (
						<Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-600">
							{discountPercentage}% OFF
						</Badge>
					)}

					<Button
						variant="ghost"
						size="sm"
						className="absolute top-2 right-2 h-8 w-8 bg-white/80 p-0 hover:bg-white"
						onClick={handleWishlistToggle}
					>
						<Heart
							className={`h-4 w-4 ${isInWishlist?.isInWishlist ? "fill-red-500 text-red-500" : ""}`}
						/>
					</Button>
				</div>

				<div className="p-4">
					<Link href={`/product/${product.id}`}>
						<h3 className="mb-2 line-clamp-2 font-semibold text-sm hover:text-primary">
							{product.name}
						</h3>
					</Link>

					<div className="mb-2 flex items-center gap-1">
						<div className="flex items-center">
							<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
							<span className="ml-1 text-xs">{product.averageRating || 0}</span>
						</div>
						<span className="text-muted-foreground text-xs">
							({product.reviewCount?.toLocaleString() || 0})
						</span>
					</div>

					<div className="mb-3 flex items-center gap-2">
						<span className="font-bold text-lg">
							₹{product.price.toLocaleString()}
						</span>
						{product.originalPrice && (
							<span className="text-muted-foreground text-sm line-through">
								₹{product.originalPrice.toLocaleString()}
							</span>
						)}
					</div>

					<Button
						onClick={handleAddToCart}
						className="w-full"
						size="sm"
						disabled={product.stock === 0}
					>
						<ShoppingCart className="mr-2 h-4 w-4" />
						{product.stock === 0 ? "Out of Stock" : "Add to Cart"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
