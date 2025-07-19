"use client";

import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { type Order, mockOrders } from "@/lib/mock-data";
import {
	CheckCircle,
	Clock,
	CreditCard,
	MapPin,
	Package,
	Phone,
	Truck,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrderDetailsPage() {
	const { user } = useAuth();
	const router = useRouter();
	const params = useParams();
	const [order, setOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user) {
			router.push("/login");
			return;
		}

		const orderId = params.id as string;
		const foundOrder = mockOrders.find(
			(o) => o.id === orderId && o.userId === user.id,
		);
		setOrder(foundOrder || null);
		setLoading(false);
	}, [user, router, params.id]);

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <Clock className="h-5 w-5" />;
			case "confirmed":
				return <CheckCircle className="h-5 w-5" />;
			case "shipped":
				return <Truck className="h-5 w-5" />;
			case "delivered":
				return <Package className="h-5 w-5" />;
			default:
				return <Clock className="h-5 w-5" />;
		}
	};

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
			default:
				return "bg-gray-500 hover:bg-gray-600";
		}
	};

	const getTrackingSteps = (status: string) => {
		const steps = [
			{ key: "pending", label: "Order Placed", icon: CheckCircle },
			{ key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
			{ key: "shipped", label: "Shipped", icon: Truck },
			{ key: "delivered", label: "Delivered", icon: Package },
		];

		const statusOrder = ["pending", "confirmed", "shipped", "delivered"];
		const currentIndex = statusOrder.indexOf(status);

		return steps.map((step, index) => ({
			...step,
			completed: index <= currentIndex,
			active: index === currentIndex,
		}));
	};

	if (!user) {
		return null;
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="animate-pulse space-y-6">
						<div className="h-8 w-1/4 rounded bg-muted" />
						<div className="h-64 rounded bg-muted" />
						<div className="h-32 rounded bg-muted" />
					</div>
				</main>
			</div>
		);
	}

	if (!order) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">Order Not Found</h1>
						<p className="mb-4 text-muted-foreground">
							The order you're looking for doesn't exist or you don't have
							access to it.
						</p>
						<Button onClick={() => router.push("/orders")}>
							Back to Orders
						</Button>
					</div>
				</main>
			</div>
		);
	}

	const trackingSteps = getTrackingSteps(order.status);

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center gap-4">
					<Button variant="outline" onClick={() => router.back()}>
						← Back
					</Button>
					<h1 className="font-bold text-3xl">Order Details</h1>
				</div>

				<div className="grid gap-8 lg:grid-cols-3">
					{/* Main Content */}
					<div className="space-y-6 lg:col-span-2">
						{/* Order Header */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>Order {order.id}</CardTitle>
										<p className="text-muted-foreground">
											Placed on {new Date(order.createdAt).toLocaleDateString()}
										</p>
									</div>
									<Badge className={getStatusColor(order.status)}>
										{getStatusIcon(order.status)}
										<span className="ml-2">
											{order.status.charAt(0).toUpperCase() +
												order.status.slice(1)}
										</span>
									</Badge>
								</div>
							</CardHeader>
						</Card>

						{/* Order Tracking */}
						<Card>
							<CardHeader>
								<CardTitle>Order Tracking</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{trackingSteps.map((step, index) => (
										<div key={step.key} className="flex items-center gap-4">
											<div
												className={`flex h-10 w-10 items-center justify-center rounded-full ${
													step.completed
														? "bg-primary text-primary-foreground"
														: "bg-muted text-muted-foreground"
												}`}
											>
												<step.icon className="h-5 w-5" />
											</div>
											<div className="flex-1">
												<p
													className={`font-medium ${step.completed ? "text-foreground" : "text-muted-foreground"}`}
												>
													{step.label}
												</p>
												{step.active && (
													<p className="text-muted-foreground text-sm">
														Updated on{" "}
														{new Date(order.updatedAt).toLocaleDateString()}
													</p>
												)}
											</div>
											{index < trackingSteps.length - 1 && (
												<div
													className={`h-8 w-px ${step.completed ? "bg-primary" : "bg-muted"}`}
												/>
											)}
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Order Items */}
						<Card>
							<CardHeader>
								<CardTitle>Order Items ({order.items.length})</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{order.items.map((item) => (
										<div
											key={item.productId || Math.random()}
											className="flex items-center gap-4 rounded-lg border p-4"
										>
											<Image
												src={item.image || "/placeholder.svg"}
												alt={item.name}
												width={80}
												height={80}
												className="rounded object-cover"
											/>
											<div className="flex-1">
												<h4 className="font-medium">{item.name}</h4>
												<p className="text-muted-foreground text-sm">
													Quantity: {item.quantity}
												</p>
												<p className="font-medium">
													₹{item.price.toLocaleString()} each
												</p>
											</div>
											<div className="text-right">
												<p className="font-bold">
													₹{(item.price * item.quantity).toLocaleString()}
												</p>
											</div>
										</div>
									))}
								</div>

								<Separator className="my-4" />

								<div className="space-y-2">
									<div className="flex justify-between">
										<span>Subtotal:</span>
										<span>₹{order.total.toLocaleString()}</span>
									</div>
									<div className="flex justify-between">
										<span>Shipping:</span>
										<span className="text-green-600">Free</span>
									</div>
									<div className="flex justify-between font-bold text-lg">
										<span>Total:</span>
										<span>₹{order.total.toLocaleString()}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Payment Info */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<CreditCard className="h-5 w-5" />
									Payment Information
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div>
										<p className="text-muted-foreground text-sm">
											Payment Method
										</p>
										<p className="font-medium capitalize">
											{order.paymentMethod}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">
											Payment Status
										</p>
										<Badge
											variant={
												order.paymentStatus === "paid" ? "default" : "secondary"
											}
										>
											{order.paymentStatus.charAt(0).toUpperCase() +
												order.paymentStatus.slice(1)}
										</Badge>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">
											Total Amount
										</p>
										<p className="font-bold text-lg">
											₹{order.total.toLocaleString()}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Delivery Address */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MapPin className="h-5 w-5" />
									Delivery Address
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-1">
									<p className="font-medium">{order.address.name}</p>
									<p>{order.address.street}</p>
									<p>
										{order.address.city}, {order.address.state}
									</p>
									<p>{order.address.pincode}</p>
									<p className="mt-2 flex items-center gap-2">
										<Phone className="h-4 w-4" />
										{order.address.phone}
									</p>
								</div>
							</CardContent>
						</Card>

						{/* Help */}
						<Card>
							<CardHeader>
								<CardTitle>Need Help?</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<Button
										variant="outline"
										className="w-full justify-start bg-transparent"
									>
										Track Package
									</Button>
									<Button
										variant="outline"
										className="w-full justify-start bg-transparent"
									>
										Contact Support
									</Button>
									<Button
										variant="outline"
										className="w-full justify-start bg-transparent"
									>
										Return/Exchange
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
