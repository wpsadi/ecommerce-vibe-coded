"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import {
	useAddToCart,
	useClearWishlist,
	useRemoveFromWishlist,
	useWishlist,
} from "@/hooks/use-trpc-hooks";
import { cn } from "@/lib/utils";
import {
	ArrowLeft,
	Filter,
	Grid,
	Heart,
	List,
	ShoppingCart,
	Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type WishlistItem = {
	id: string;
	createdAt: string;
	product: {
		id: string;
		name: string;
		slug: string;
		price: string | number;
		originalPrice?: string | number;
		stock: number;
		active: boolean;
		category: {
			id: string;
			name: string;
		};
	};
	primaryImage: {
		url: string;
		altText: string;
	} | null;
};

export default function WishlistPage() {
	const router = useRouter();
	const [sortBy, setSortBy] = useState<"added_at" | "price" | "name">(
		"added_at",
	);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	// tRPC Hooks
	const { data: wishlistItems, isPending } = useWishlist();
	const removeFromWishlist = useRemoveFromWishlist();
	const clearWishlist = useClearWishlist();
	const addToCart = useAddToCart();

	// Transform the flat database structure to match the expected nested structure
	const transformedItems: WishlistItem[] =
		wishlistItems?.map((item) => ({
			id: item.id,
			createdAt: item.createdAt.toISOString(),
			product: {
				id: item.productId || "",
				name: item.productName || "",
				slug: item.productSlug || "",
				price: item.productPrice || "0",
				originalPrice: item.productOriginalPrice || undefined,
				stock: item.productStock || 0,
				active: item.productActive || false,
				category: {
					id: "", // Not available in flat structure
					name: item.categoryName || "",
				},
			},
			primaryImage: {
				url: item.imageUrl || "",
				altText: item.imageAltText || "",
			},
		})) || [];

	const handleRemoveItem = async (itemId: string) => {
		try {
			await removeFromWishlist.mutateAsync({ itemId });
			toast.success("Item removed from wishlist");
		} catch (error) {
			toast.error("Failed to remove item");
		}
	};

	const handleClearWishlist = async () => {
		try {
			await clearWishlist.mutateAsync();
			toast.success("Wishlist cleared");
		} catch (error) {
			toast.error("Failed to clear wishlist");
		}
	};

	const handleAddToCart = async (productId: string, productName: string) => {
		try {
			await addToCart.mutateAsync({
				productId,
				quantity: 1,
			});
			toast.success(`${productName} added to cart!`);
		} catch (error) {
			toast.error("Failed to add to cart");
		}
	};

	const handleMoveAllToCart = async () => {
		if (!wishlistItems || wishlistItems.length === 0) return;

		try {
			const promises = transformedItems.map((item) =>
				addToCart.mutateAsync({
					productId: item.product.id,
					quantity: 1,
				}),
			);

			await Promise.all(promises);
			toast.success("All items moved to cart!");
		} catch (error) {
			toast.error("Failed to move items to cart");
		}
	};

	const handleSortChange = (value: string) => {
		const [newSortBy, newSortOrder] = value.split("-") as [
			typeof sortBy,
			typeof sortOrder,
		];
		setSortBy(newSortBy);
		setSortOrder(newSortOrder);
	};

	// Sort items
	const sortedItems =
		transformedItems.length > 0
			? [...transformedItems].sort((a, b) => {
					let aValue: string | number | Date;
					let bValue: string | number | Date;

					switch (sortBy) {
						case "name":
							aValue = a.product.name.toLowerCase();
							bValue = b.product.name.toLowerCase();
							break;
						case "price":
							aValue = Number(a.product.price);
							bValue = Number(b.product.price);
							break;
						default:
							aValue = new Date(a.createdAt);
							bValue = new Date(b.createdAt);
							break;
					}

					if (sortOrder === "asc") {
						return aValue > bValue ? 1 : -1;
					}
					return aValue < bValue ? 1 : -1;
				})
			: [];

	if (isPending) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8">
					<div className="animate-pulse space-y-4">
						<div className="h-8 w-32 rounded bg-gray-200" />
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{[...Array(8)].map((_, i) => (
								<div
									key={`wishlist-skeleton-${i}`}
									className="h-64 rounded bg-gray-200"
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!wishlistItems || wishlistItems.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8">
					<div className="flex flex-col items-center justify-center py-16">
						<Heart className="mb-6 h-24 w-24 text-gray-300" />
						<h2 className="mb-2 font-bold text-2xl">Your wishlist is empty</h2>
						<p className="mb-8 max-w-md text-center text-gray-600">
							Save items you love for later. Start browsing and add products to
							your wishlist!
						</p>
						<div className="flex gap-4">
							<Button onClick={() => router.push("/products")}>
								Start Shopping
							</Button>
							<Button
								variant="outline"
								onClick={() => router.push("/categories")}
							>
								Browse Categories
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				{/* Header */}
				<div className="mb-8 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="sm" onClick={() => router.back()}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back
						</Button>
						<div>
							<h1 className="font-bold text-3xl">My Wishlist</h1>
							<p className="text-gray-600">
								{wishlistItems.length}{" "}
								{wishlistItems.length === 1 ? "item" : "items"} saved
							</p>
						</div>
					</div>

					<div className="flex items-center gap-4">
						{wishlistItems.length > 0 && (
							<>
								<Button
									onClick={handleMoveAllToCart}
									disabled={addToCart.isPending}
								>
									<ShoppingCart className="mr-2 h-4 w-4" />
									Move All to Cart
								</Button>
								<Button
									variant="outline"
									onClick={handleClearWishlist}
									disabled={clearWishlist.isPending}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Clear Wishlist
								</Button>
							</>
						)}
					</div>
				</div>

				{/* Filters */}
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Filter className="h-5 w-5" />
						<Select
							value={`${sortBy}-${sortOrder}`}
							onValueChange={handleSortChange}
						>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="added_at-desc">Recently Added</SelectItem>
								<SelectItem value="added_at-asc">Oldest First</SelectItem>
								<SelectItem value="name-asc">Name A-Z</SelectItem>
								<SelectItem value="name-desc">Name Z-A</SelectItem>
								<SelectItem value="price-asc">Price Low to High</SelectItem>
								<SelectItem value="price-desc">Price High to Low</SelectItem>
							</SelectContent>
						</Select>
					</div>

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

				{/* Wishlist Items */}
				<div
					className={cn(
						viewMode === "grid"
							? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
							: "space-y-4",
					)}
				>
					{sortedItems.map((item) => (
						<WishlistItem
							key={item.id}
							item={item}
							viewMode={viewMode}
							onRemove={handleRemoveItem}
							onAddToCart={handleAddToCart}
							isRemoving={removeFromWishlist.isPending}
							isAddingToCart={addToCart.isPending}
						/>
					))}
				</div>

				{/* Recommendations */}
				<div className="mt-16">
					<h2 className="mb-6 font-bold text-2xl">You might also like</h2>
					<div className="rounded-lg border bg-white py-8 text-center">
						<p className="text-gray-600">
							Personalized recommendations based on your wishlist coming soon!
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function WishlistItem({
	item,
	viewMode,
	onRemove,
	onAddToCart,
	isRemoving,
	isAddingToCart,
}: {
	item: WishlistItem;
	viewMode: "grid" | "list";
	onRemove: (itemId: string) => void;
	onAddToCart: (productId: string, productName: string) => void;
	isRemoving: boolean;
	isAddingToCart: boolean;
}) {
	const discountPercentage = item.product.originalPrice
		? Math.round(
				((Number(item.product.originalPrice) - Number(item.product.price)) /
					Number(item.product.originalPrice)) *
					100,
			)
		: 0;

	const isOutOfStock = item.product.stock === 0;

	if (viewMode === "list") {
		return (
			<Card className="overflow-hidden">
				<div className="flex">
					<div className="relative h-48 w-48 flex-shrink-0">
						<Link href={`/product/${item.product.id}`}>
							<Image
								src={item.primaryImage?.url || "/placeholder-product.jpg"}
								alt={item.primaryImage?.altText || item.product.name}
								fill
								className="object-cover"
							/>
						</Link>
						{discountPercentage > 0 && (
							<Badge className="absolute top-2 left-2 bg-red-500">
								-{discountPercentage}%
							</Badge>
						)}
						{isOutOfStock && (
							<Badge variant="secondary" className="absolute top-2 right-2">
								Out of Stock
							</Badge>
						)}
					</div>

					<div className="flex-1 p-6">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<Link href={`/product/${item.product.id}`}>
									<h3 className="mb-2 font-semibold text-lg transition-colors hover:text-primary">
										{item.product.name}
									</h3>
								</Link>

								<div className="mb-4 flex items-center gap-3">
									<span className="font-bold text-2xl">
										₹{Number(item.product.price).toLocaleString()}
									</span>
									{item.product.originalPrice && (
										<span className="text-gray-500 text-lg line-through">
											₹{Number(item.product.originalPrice).toLocaleString()}
										</span>
									)}
								</div>

								<p className="mb-4 text-gray-600 text-sm">
									Added on {new Date(item.createdAt).toLocaleDateString()}
								</p>
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="icon"
									onClick={() => onRemove(item.id)}
									disabled={isRemoving}
								>
									<Trash2 className="h-4 w-4" />
								</Button>

								<Button
									onClick={() =>
										onAddToCart(item.product.id, item.product.name)
									}
									disabled={isOutOfStock || isAddingToCart}
									className="min-w-32"
								>
									<ShoppingCart className="mr-2 h-4 w-4" />
									{isAddingToCart
										? "Adding..."
										: isOutOfStock
											? "Out of Stock"
											: "Add to Cart"}
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
				<Link href={`/product/${item.product.id}`}>
					<Image
						src={item.primaryImage?.url || "/placeholder-product.jpg"}
						alt={item.primaryImage?.altText || item.product.name}
						fill
						className="object-cover transition-transform group-hover:scale-105"
					/>
				</Link>

				{discountPercentage > 0 && (
					<Badge className="absolute top-2 left-2 bg-red-500">
						-{discountPercentage}%
					</Badge>
				)}

				{isOutOfStock && (
					<Badge variant="secondary" className="absolute top-2 right-2">
						Out of Stock
					</Badge>
				)}

				<Button
					variant="ghost"
					size="icon"
					className="absolute right-2 bottom-2 bg-white/80 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
					onClick={() => onRemove(item.id)}
					disabled={isRemoving}
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>

			<CardContent className="p-4">
				<Link href={`/product/${item.product.id}`}>
					<h3 className="mb-2 line-clamp-2 font-medium transition-colors hover:text-primary">
						{item.product.name}
					</h3>
				</Link>

				<div className="mb-3 flex items-center gap-2">
					<span className="font-bold">
						₹{Number(item.product.price).toLocaleString()}
					</span>
					{item.product.originalPrice && (
						<span className="text-gray-500 text-sm line-through">
							₹{Number(item.product.originalPrice).toLocaleString()}
						</span>
					)}
				</div>

				<p className="mb-3 text-gray-600 text-xs">
					Added {new Date(item.createdAt).toLocaleDateString()}
				</p>

				<Button
					className="w-full"
					onClick={() => onAddToCart(item.product.id, item.product.name)}
					disabled={isOutOfStock || isAddingToCart}
				>
					<ShoppingCart className="mr-2 h-4 w-4" />
					{isAddingToCart
						? "Adding..."
						: isOutOfStock
							? "Out of Stock"
							: "Add to Cart"}
				</Button>
			</CardContent>
		</Card>
	);
}
