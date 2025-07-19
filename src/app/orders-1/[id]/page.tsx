"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrder } from "@/hooks/use-trpc-hooks";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function OrderDetailsPage() {
	const params = useParams();
	const { data: order, isPending } = useOrder(params.id as string);

	if (isPending) {
		return <div>Loading order details...</div>;
	}

	if (!order) {
		return <div>Order not found.</div>;
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl">Order #{order.orderNumber}</h1>
						<p className="text-gray-600">
							Placed on {new Date(order.createdAt).toLocaleDateString()}
						</p>
					</div>
					<Badge
						variant={order.status === "delivered" ? "default" : "secondary"}
						className="text-lg"
					>
						{order.status}
					</Badge>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<div className="space-y-6 lg:col-span-2">
						<Card>
							<CardHeader>
								<CardTitle>Order Items</CardTitle>
							</CardHeader>
							<CardContent>
								{order.items.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-4 border-b py-4 last:border-b-0"
									>
										<Image
											src={item.productImage || "/placeholder.svg"}
											alt={item.productName}
											width={80}
											height={80}
											className="rounded-md"
										/>
										<div className="flex-1">
											<Link
												href={`/product/${item.productId}`}
												className="font-medium hover:text-primary"
											>
												{item.productName}
											</Link>
											<p className="text-gray-600 text-sm">
												SKU: {item.productSku}
											</p>
										</div>
										<div className="text-right">
											<p className="font-semibold">
												₹{Number(item.unitPrice).toFixed(2)} x {item.quantity}
											</p>
											<p className="font-bold">
												₹{Number(item.totalPrice).toFixed(2)}
											</p>
										</div>
									</div>
								))}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Order History</CardTitle>
							</CardHeader>
							<CardContent>
								{order.statusHistory.map((history) => (
									<div
										key={history.id}
										className="flex gap-4 border-b py-4 last:border-b-0"
									>
										<div className="text-gray-600 text-sm">
											{new Date(history.createdAt).toLocaleString()}
										</div>
										<div className="flex-1">
											<p className="font-medium">{history.status}</p>
											<p className="text-gray-500 text-sm">{history.comment}</p>
										</div>
									</div>
								))}
							</CardContent>
						</Card>
					</div>

					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Order Summary</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<div className="flex justify-between">
									<span>Subtotal</span>
									<span>₹{Number(order.subtotal).toFixed(2)}</span>
								</div>
								<div className="flex justify-between">
									<span>Shipping</span>
									<span>₹{Number(order.shippingAmount).toFixed(2)}</span>
								</div>
								<div className="flex justify-between">
									<span>Tax</span>
									<span>₹{Number(order.taxAmount).toFixed(2)}</span>
								</div>
								<div className="flex justify-between text-green-600">
									<span>Discount</span>
									<span>-₹{Number(order.discountAmount).toFixed(2)}</span>
								</div>
								<Separator />
								<div className="flex justify-between font-bold text-lg">
									<span>Total</span>
									<span>₹{Number(order.totalAmount).toFixed(2)}</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Shipping Address</CardTitle>
							</CardHeader>
							<CardContent>
								<p>
									{order.shippingAddress.firstName}{" "}
									{order.shippingAddress.lastName}
								</p>
								<p>{order.shippingAddress.addressLine1}</p>
								{order.shippingAddress.addressLine2 && (
									<p>{order.shippingAddress.addressLine2}</p>
								)}
								<p>
									{order.shippingAddress.city}, {order.shippingAddress.state}{" "}
									{order.shippingAddress.postalCode}
								</p>
								<p>{order.shippingAddress.country}</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
