"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function WishlistPage() {
	const { items, removeFromWishlist } = useWishlist();
	const { addToCart } = useCart();
	const { user } = useAuth();

	const handleAddToCart = (item: {
		id: string;
		name: string;
		price: number;
		image: string;
	}) => {
		addToCart({
			id: item.id,
			name: item.name,
			price: item.price,
			image: item.image,
			stock: 50, // Mock stock value
		});

		toast.success(`${item.name} has been added to your cart`);
	};

	if (!user) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">Please Login</h1>
						<p className="mb-4 text-muted-foreground">
							You need to login to view your wishlist
						</p>
						<Link href="/login">
							<Button>Login</Button>
						</Link>
					</div>
				</main>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<Heart className="mx-auto mb-4 h-24 w-24 text-muted-foreground" />
						<h1 className="mb-4 font-bold text-2xl">Your wishlist is empty</h1>
						<p className="mb-8 text-muted-foreground">
							Add some products to your wishlist
						</p>
						<Link href="/">
							<Button>Continue Shopping</Button>
						</Link>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<h1 className="mb-8 font-bold text-2xl">
					My Wishlist ({items.length} items)
				</h1>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{items.map((item) => (
						<Card key={item.id} className="overflow-hidden">
							<CardContent className="p-0">
								<div className="relative">
									<Link href={`/product/${item.id}`}>
										<div className="aspect-square overflow-hidden">
											<Image
												src={item.image || "/placeholder.svg"}
												alt={item.name}
												width={300}
												height={300}
												className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
											/>
										</div>
									</Link>

									<Button
										variant="ghost"
										size="sm"
										className="absolute top-2 right-2 h-8 w-8 bg-white/80 p-0 hover:bg-white"
										onClick={() => removeFromWishlist(item.id)}
									>
										<Trash2 className="h-4 w-4 text-red-500" />
									</Button>
								</div>

								<div className="p-4">
									<Link href={`/product/${item.id}`}>
										<h3 className="mb-2 line-clamp-2 font-semibold text-sm hover:text-primary">
											{item.name}
										</h3>
									</Link>

									<div className="mb-3 flex items-center gap-2">
										<span className="font-bold text-lg">
											₹{item.price.toLocaleString()}
										</span>
										{item.originalPrice && (
											<span className="text-muted-foreground text-sm line-through">
												₹{item.originalPrice.toLocaleString()}
											</span>
										)}
									</div>

									<div className="flex gap-2">
										<Button
											onClick={() => handleAddToCart(item)}
											className="flex-1"
											size="sm"
										>
											<ShoppingCart className="mr-2 h-4 w-4" />
											Add to Cart
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => removeFromWishlist(item.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</main>
		</div>
	);
}
