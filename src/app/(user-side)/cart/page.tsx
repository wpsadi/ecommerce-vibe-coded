"use client";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CartPage() {
	const { items, updateQuantity, removeFromCart, totalPrice, totalItems } =
		useCart();
	const { user } = useAuth();
	const router = useRouter();

	const handleCheckout = () => {
		if (!user) {
			toast.error("Please login to proceed with checkout");
			router.push("/login");
			return;
		}
		router.push("/checkout");
	};

	if (!user) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">Please Login</h1>
						<p className="mb-4 text-muted-foreground">
							You need to login to view your cart
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
						<ShoppingBag className="mx-auto mb-4 h-24 w-24 text-muted-foreground" />
						<h1 className="mb-4 font-bold text-2xl">Your cart is empty</h1>
						<p className="mb-8 text-muted-foreground">
							Add some products to get started
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
					Shopping Cart ({totalItems} items)
				</h1>

				<div className="grid gap-8 lg:grid-cols-3">
					{/* Cart Items */}
					<div className="space-y-4 lg:col-span-2">
						{items.map((item) => (
							<Card key={item.id}>
								<CardContent className="p-4">
									<div className="flex gap-4">
										<div className="h-24 w-24 flex-shrink-0">
											<Image
												src={item.image || "/placeholder.svg"}
												alt={item.name}
												width={96}
												height={96}
												className="h-full w-full rounded object-cover"
											/>
										</div>

										<div className="flex-1">
											<h3 className="mb-2 font-semibold">{item.name}</h3>
											<p className="mb-2 font-bold text-lg">
												₹{item.price.toLocaleString()}
											</p>

											<div className="flex items-center justify-between">
												<div className="flex items-center rounded border">
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															updateQuantity(item.id, item.quantity - 1)
														}
														disabled={item.quantity <= 1}
													>
														<Minus className="h-4 w-4" />
													</Button>
													<span className="min-w-[3rem] px-4 py-2 text-center">
														{item.quantity}
													</span>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															updateQuantity(item.id, item.quantity + 1)
														}
														disabled={item.quantity >= item.stock}
													>
														<Plus className="h-4 w-4" />
													</Button>
												</div>

												<Button
													variant="ghost"
													size="sm"
													onClick={() => removeFromCart(item.id)}
													className="text-red-500 hover:text-red-700"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Order Summary */}
					<div>
						<Card className="sticky top-24">
							<CardHeader>
								<CardTitle>Order Summary</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex justify-between">
									<span>Subtotal ({totalItems} items)</span>
									<span>₹{totalPrice.toLocaleString()}</span>
								</div>

								<div className="flex justify-between">
									<span>Shipping</span>
									<span className="text-green-600">Free</span>
								</div>

								<Separator />

								<div className="flex justify-between font-bold text-lg">
									<span>Total</span>
									<span>₹{totalPrice.toLocaleString()}</span>
								</div>

								<Button onClick={handleCheckout} className="w-full" size="lg">
									Proceed to Checkout
								</Button>

								<Link href="/">
									<Button variant="outline" className="w-full bg-transparent">
										Continue Shopping
									</Button>
								</Link>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
