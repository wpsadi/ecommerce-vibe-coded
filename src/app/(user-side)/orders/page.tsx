"use client";

import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useOrders } from "@/hooks/use-trpc-hooks";
import { Eye, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OrdersPage() {
	const { user } = useAuth();
	const router = useRouter();

	// tRPC Hooks
	const { data: orders, isPending } = useOrders({ limit: 50, offset: 0 });

	useEffect(() => {
		if (!user) {
			router.push("/login");
			return;
		}
	}, [user, router]);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-500 hover:bg-yellow-600";
			case "confirmed":
				return "bg-blue-500 hover:bg-blue-600";
			case "shipped":
				return "bg-purple-500 hover:bg-purple-600";
			case "delivered":
				return "bg-green-500 hover:bg-green-600";
			case "cancelled":
				return "bg-red-500 hover:bg-red-600";
			case "refunded":
				return "bg-orange-500 hover:bg-orange-600";
			default:
				return "bg-gray-500 hover:bg-gray-600";
		}
	};

	if (!user) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">Please Login</h1>
						<p className="mb-4 text-muted-foreground">
							You need to login to view your orders
						</p>
						<Link href="/login">
							<Button>Login</Button>
						</Link>
					</div>
				</main>
			</div>
		);
	}

	if (isPending) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<Card key={`loading-order-${i}`}>
								<CardContent className="p-6">
									<div className="animate-pulse space-y-4">
										<div className="h-4 w-1/4 rounded bg-muted" />
										<div className="h-4 w-1/2 rounded bg-muted" />
										<div className="h-4 w-1/3 rounded bg-muted" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</main>
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<ShoppingBag className="mx-auto mb-4 h-24 w-24 text-muted-foreground" />
						<h1 className="mb-4 font-bold text-2xl">No Orders Yet</h1>
						<p className="mb-8 text-muted-foreground">
							You haven't placed any orders yet
						</p>
						<Link href="/">
							<Button>Start Shopping</Button>
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
				<h1 className="mb-8 font-bold text-3xl">My Orders</h1>

				<div className="space-y-6">
					{orders.map((order) => (
						<Card key={order.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-lg">Order {order.id}</CardTitle>
										<p className="text-muted-foreground text-sm">
											Placed on {new Date(order.createdAt).toLocaleDateString()}
										</p>
									</div>
									<div className="flex items-center gap-4">
										<Badge className={getStatusColor(order.status)}>
											{order.status.charAt(0).toUpperCase() +
												order.status.slice(1)}
										</Badge>
										<Link href={`/orders/${order.id}`}>
											<Button variant="outline" size="sm">
												<Eye className="mr-2 h-4 w-4" />
												View Details
											</Button>
										</Link>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{/* Order Items */}
									<div className="flex items-center gap-4">
										<div className="-space-x-2 flex">
											{(order as any).items?.slice(0, 4).map((item: any) => (
												<Image
													key={item.id}
													src={item.productImage || "/placeholder.svg"}
													alt={item.productName}
													width={40}
													height={40}
													className="rounded border-2 border-background"
												/>
											))}
										</div>
										<div>
											<p className="font-medium">
												{(order as any).items?.length || 0} item
												{((order as any).items?.length || 0) > 1 ? "s" : ""}
											</p>
											<p className="text-muted-foreground text-sm">
												{(order as any).items?.[0]?.productName || "Product"}
												{((order as any).items?.length || 0) > 1 &&
													` and ${(order as any).items.length - 1} more`}
											</p>
										</div>
									</div>

									{/* Order Summary */}
									<div className="flex items-center justify-between border-t pt-4">
										<div>
											<p className="text-muted-foreground text-sm">
												Total Amount
											</p>
											<p className="font-bold text-lg">
												₹{Number(order.totalAmount).toLocaleString()}
											</p>
										</div>
										<div className="text-right">
											<p className="text-muted-foreground text-sm">
												Payment Method
											</p>
											<p className="font-medium capitalize">
												{order.paymentMethod}
											</p>
										</div>
									</div>

									{/* Delivery Address */}
									<div className="rounded-lg bg-muted p-3">
										<p className="mb-1 font-medium text-sm">Delivery Address</p>
										<p className="text-muted-foreground text-sm">
											{order.shippingAddress?.firstName}{" "}
											{order.shippingAddress?.lastName},{" "}
											{order.shippingAddress?.addressLine1},{" "}
											{order.shippingAddress?.city},{" "}
											{order.shippingAddress?.state} -{" "}
											{order.shippingAddress?.postalCode}
										</p>
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
