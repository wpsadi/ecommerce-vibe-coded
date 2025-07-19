"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	useCartWithSummary,
	useClearCart,
	useCouponByCode,
	useRemoveFromCart,
	useUpdateCartItemQuantity,
} from "@/hooks/use-trpc-hooks";
import { cn } from "@/lib/utils";
import {
	ArrowLeft,
	Gift,
	Minus,
	Plus,
	ShoppingBag,
	Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function CartPage() {
	const router = useRouter();
	const [couponCode, setCouponCode] = useState("");
	const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

	// tRPC Hooks
	const { items: cartItems, summary, isPending } = useCartWithSummary();
	const updateCartItem = useUpdateCartItemQuantity();
	const removeFromCart = useRemoveFromCart();
	const clearCart = useClearCart();
	const { data: coupon, refetch: fetchCoupon } = useCouponByCode(
		appliedCoupon || "",
	);

	const handleQuantityChange = async (itemId: string, newQuantity: number) => {
		if (newQuantity <= 0) {
			handleRemoveItem(itemId);
			return;
		}

		try {
			await updateCartItem.mutateAsync({
				itemId,
				quantity: newQuantity,
			});
		} catch (error) {
			toast.error("Failed to update quantity");
		}
	};

	const handleRemoveItem = async (itemId: string) => {
		try {
			await removeFromCart.mutateAsync({ itemId });
			toast.success("Item removed from cart");
		} catch (error) {
			toast.error("Failed to remove item");
		}
	};

	const handleClearCart = async () => {
		try {
			await clearCart.mutateAsync();
			toast.success("Cart cleared");
		} catch (error) {
			toast.error("Failed to clear cart");
		}
	};

	const applyCoupon = () => {
		if (!couponCode.trim()) {
			toast.error("Please enter a coupon code");
			return;
		}
		setAppliedCoupon(couponCode.toUpperCase());
		fetchCoupon();
	};

	const removeCoupon = () => {
		setAppliedCoupon(null);
		toast.success("Coupon removed");
	};

	// Calculate totals
	const subtotal = Number(summary?.subtotal) || 0;
	const savings = Number(summary?.savings) || 0;

	const couponDiscount = coupon
		? coupon.type === "percentage"
			? subtotal * (Number(coupon.value) / 100)
			: Number(coupon.value)
		: 0;

	const shipping =
		coupon?.type === "free_shipping" ? 0 : subtotal > 500 ? 0 : 50;
	const tax = (subtotal - couponDiscount) * 0.18; // 18% GST
	const total = subtotal - couponDiscount + shipping + tax;

	if (isPending) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8">
					<div className="animate-pulse space-y-4">
						<div className="h-8 w-32 rounded bg-gray-200" />
						<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
							<div className="space-y-4 lg:col-span-2">
								{[...Array(3)].map((_, i) => (
									<div
										key={`loading-${i}`}
										className="h-32 rounded bg-gray-200"
									/>
								))}
							</div>
							<div className="h-64 rounded bg-gray-200" />
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!cartItems || cartItems.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8">
					<div className="flex flex-col items-center justify-center py-16">
						<ShoppingBag className="mb-6 h-24 w-24 text-gray-300" />
						<h2 className="mb-2 font-bold text-2xl">Your cart is empty</h2>
						<p className="mb-8 max-w-md text-center text-gray-600">
							Looks like you haven't added any items to your cart yet. Start
							shopping to fill it up!
						</p>
						<div className="flex gap-4">
							<Button onClick={() => router.push("/products")}>
								Continue Shopping
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
							<h1 className="font-bold text-3xl">Shopping Cart</h1>
							<p className="text-gray-600">
								{cartItems.length} {cartItems.length === 1 ? "item" : "items"}
							</p>
						</div>
					</div>

					{cartItems.length > 0 && (
						<Button
							variant="outline"
							onClick={handleClearCart}
							disabled={clearCart.isPending}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Clear Cart
						</Button>
					)}
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Cart Items */}
					<div className="space-y-4 lg:col-span-2">
						{cartItems.map((item: any) => (
							<CartItem
								key={item.id || Math.random()}
								item={item}
								onQuantityChange={handleQuantityChange}
								onRemove={handleRemoveItem}
								isUpdating={updateCartItem.isPending}
								isRemoving={removeFromCart.isPending}
							/>
						))}

						{/* Continue Shopping */}
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="mb-1 font-medium">Continue Shopping</h3>
										<p className="text-gray-600 text-sm">
											Discover more products you might like
										</p>
									</div>
									<Button
										variant="outline"
										onClick={() => router.push("/products")}
									>
										Shop More
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Order Summary */}
					<div className="space-y-6">
						{/* Coupon Code */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Gift className="h-5 w-5" />
									Coupon Code
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{!appliedCoupon ? (
									<div className="flex gap-2">
										<Input
											placeholder="Enter coupon code"
											value={couponCode}
											onChange={(e) => setCouponCode(e.target.value)}
											onKeyPress={(e) => e.key === "Enter" && applyCoupon()}
										/>
										<Button onClick={applyCoupon}>Apply</Button>
									</div>
								) : (
									<div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
										<div className="flex items-center gap-2">
											<Badge variant="secondary">{appliedCoupon}</Badge>
											<span className="text-green-700 text-sm">
												Coupon applied!
											</span>
										</div>
										<Button variant="ghost" size="sm" onClick={removeCoupon}>
											Remove
										</Button>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Order Summary */}
						<Card>
							<CardHeader>
								<CardTitle>Order Summary</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<div className="flex justify-between">
										<span>Subtotal</span>
										<span>₹{subtotal.toFixed(2)}</span>
									</div>

									{savings > 0 && (
										<div className="flex justify-between text-green-600">
											<span>Savings</span>
											<span>-₹{savings.toFixed(2)}</span>
										</div>
									)}

									{couponDiscount > 0 && (
										<div className="flex justify-between text-green-600">
											<span>Coupon Discount</span>
											<span>-₹{couponDiscount.toFixed(2)}</span>
										</div>
									)}

									<div className="flex justify-between">
										<span>Shipping</span>
										<span className={cn(shipping === 0 && "text-green-600")}>
											{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}
										</span>
									</div>

									<div className="flex justify-between">
										<span>Tax (GST 18%)</span>
										<span>₹{tax.toFixed(2)}</span>
									</div>
								</div>

								<Separator />

								<div className="flex justify-between font-bold text-lg">
									<span>Total</span>
									<span>₹{total.toFixed(2)}</span>
								</div>

								{subtotal < 500 && (
									<div className="rounded-lg bg-blue-50 p-3">
										<p className="text-blue-700 text-sm">
											Add ₹{(500 - subtotal).toFixed(2)} more for free shipping!
										</p>
									</div>
								)}

								<Button
									className="w-full"
									size="lg"
									onClick={() => router.push("/checkout")}
								>
									Proceed to Checkout
								</Button>
							</CardContent>
						</Card>

						{/* Recommended Items */}
						<Card>
							<CardHeader>
								<CardTitle>You might also like</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600 text-sm">
									Personalized recommendations coming soon!
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

function CartItem({
	item,
	onQuantityChange,
	onRemove,
	isUpdating,
	isRemoving,
}: {
	item: {
		id: string;
		quantity: number;
		product: {
			id: string;
			name: string;
			price: string;
			originalPrice?: string;
			stock: number;
			primaryImage?: string;
		};
	};
	onQuantityChange: (itemId: string, quantity: number) => void;
	onRemove: (itemId: string) => void;
	isUpdating: boolean;
	isRemoving: boolean;
}) {
	const discountPercentage = item.product.originalPrice
		? Math.round(
				((Number(item.product.originalPrice) - Number(item.product.price)) /
					Number(item.product.originalPrice)) *
					100,
			)
		: 0;

	const itemTotal = Number(item.product.price) * item.quantity;
	const itemSavings = item.product.originalPrice
		? (Number(item.product.originalPrice) - Number(item.product.price)) *
			item.quantity
		: 0;

	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex gap-4">
					<div className="relative h-24 w-24 flex-shrink-0">
						<Image
							src={item.product.primaryImage || "/placeholder-product.jpg"}
							alt={item.product.name}
							fill
							className="rounded-lg object-cover"
						/>
						{discountPercentage > 0 && (
							<Badge className="-top-2 -right-2 absolute bg-red-500 text-xs">
								{discountPercentage}%
							</Badge>
						)}
					</div>

					<div className="flex-1">
						<div className="mb-2 flex items-start justify-between">
							<Link
								href={`/product/${item.product.id}`}
								className="font-medium transition-colors hover:text-primary"
							>
								{item.product.name}
							</Link>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onRemove(item.id)}
								disabled={isRemoving}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>

						<div className="mb-3 flex items-center gap-2">
							<span className="font-bold">
								₹{Number(item.product.price).toFixed(2)}
							</span>
							{item.product.originalPrice && (
								<span className="text-gray-500 text-sm line-through">
									₹{Number(item.product.originalPrice).toFixed(2)}
								</span>
							)}
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => onQuantityChange(item.id, item.quantity - 1)}
									disabled={isUpdating || item.quantity <= 1}
								>
									<Minus className="h-3 w-3" />
								</Button>
								<span className="w-12 text-center font-medium">
									{item.quantity}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => onQuantityChange(item.id, item.quantity + 1)}
									disabled={isUpdating || item.quantity >= item.product.stock}
								>
									<Plus className="h-3 w-3" />
								</Button>
							</div>

							<div className="text-right">
								<div className="font-bold">₹{itemTotal.toFixed(2)}</div>
								{itemSavings > 0 && (
									<div className="text-green-600 text-sm">
										Save ₹{itemSavings.toFixed(2)}
									</div>
								)}
							</div>
						</div>

						{item.quantity >= item.product.stock && (
							<p className="mt-2 text-red-600 text-sm">
								Only {item.product.stock} in stock
							</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
