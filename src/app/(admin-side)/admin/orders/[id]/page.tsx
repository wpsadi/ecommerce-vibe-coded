"use client";

import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import {
	useOrder,
	useUpdateOrderStatus,
	useUser,
} from "@/hooks/use-trpc-hooks";
import {
	CheckCircle,
	Clock,
	CreditCard,
	Package,
	Truck,
	User,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

type Address = {
	firstName: string;
	lastName: string;
	company?: string;
	phone?: string;
	addressLine1: string;
	addressLine2?: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
};

export default function AdminOrderDetailsPage() {
	const { user: authUser } = useAuth();
	const router = useRouter();
	const params = useParams();
	const orderId = params.id as string;

	const { data: order, isPending: orderLoading } = useOrder(orderId);
	const { data: customer, isPending: customerLoading } = useUser(
		order?.userId ?? "",
	);
	const updateStatus = useUpdateOrderStatus();

	useEffect(() => {
		if (!authUser || authUser.role !== "admin") {
			router.push("/login");
		}
	}, [authUser, router]);

	const handleStatusUpdate = async (
		newStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled",
	) => {
		if (!order) return;

		try {
			await updateStatus.mutateAsync({
				id: orderId,
				status: newStatus,
			});
			toast.success(`Order status has been updated to ${newStatus}`);
		} catch (error) {
			toast.error("Failed to update order status");
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <Clock className="h-4 w-4" />;
			case "confirmed":
				return <CheckCircle className="h-4 w-4" />;
			case "shipped":
				return <Truck className="h-4 w-4" />;
			case "delivered":
				return <Package className="h-4 w-4" />;
			case "cancelled":
				return <XCircle className="h-4 w-4" />;
			default:
				return <Clock className="h-4 w-4" />;
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

	if (orderLoading || customerLoading) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8 text-center">
					Loading...
				</main>
			</div>
		);
	}

	if (!authUser || authUser.role !== "admin") {
		return null;
	}

	if (!order) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">Order Not Found</h1>
						<Button onClick={() => router.push("/admin/orders")}>
							Back to Orders
						</Button>
					</div>
				</main>
			</div>
		);
	}

	const shippingAddress = order.shippingAddress as Address;
	const billingAddress = order.billingAddress as Address;

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
					{/* Order Info */}
					<div className="space-y-6 lg:col-span-2">
						{/* Order Header */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>Order #{order.orderNumber}</CardTitle>
									<Badge className={getStatusColor(order.status)}>
										{getStatusIcon(order.status)}
										<span className="ml-2">
											{order.status.charAt(0).toUpperCase() +
												order.status.slice(1)}
										</span>
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid gap-4 md:grid-cols-2">
									<div>
										<p className="text-muted-foreground text-sm">Order Date</p>
										<p className="font-medium">
											{new Date(order.createdAt).toLocaleString()}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-sm">
											Last Updated
										</p>
										<p className="font-medium">
											{order.updatedAt
												? new Date(order.updatedAt).toLocaleString()
												: "N/A"}
										</p>
									</div>
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
											<CreditCard className="mr-1 h-3 w-3" />
											{order.paymentStatus.charAt(0).toUpperCase() +
												order.paymentStatus.slice(1)}
										</Badge>
									</div>
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
											key={item.id}
											className="flex items-center gap-4 rounded-lg border p-4"
										>
											<Image
												src={item.productImage || "/placeholder.svg"}
												alt={item.productName}
												width={80}
												height={80}
												className="rounded object-cover"
											/>
											<div className="flex-1">
												<h4 className="font-medium">{item.productName}</h4>
												<p className="text-muted-foreground text-sm">
													Quantity: {item.quantity}
												</p>
												<p className="font-medium">
													₹{Number.parseFloat(item.unitPrice).toLocaleString()}{" "}
													each
												</p>
											</div>
											<div className="text-right">
												<p className="font-bold">
													₹{Number.parseFloat(item.totalPrice).toLocaleString()}
												</p>
											</div>
										</div>
									))}
								</div>

								<Separator className="my-4" />

								<div className="space-y-2">
									<div className="flex justify-between">
										<span>Subtotal:</span>
										<span>
											₹
											{Number.parseFloat(
												order.subtotal ?? "0",
											).toLocaleString()}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Shipping:</span>
										<span className="text-green-600">
											{Number.parseFloat(order.shippingAmount ?? "0") === 0
												? "Free"
												: `₹${Number.parseFloat(
													order.shippingAmount ?? "0",
												).toLocaleString()}`}
										</span>
									</div>
									<div className="flex justify-between font-bold text-lg">
										<span>Total:</span>
										<span>
											₹
											{Number.parseFloat(
												order.totalAmount ?? "0",
											).toLocaleString()}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Status Update */}
						<Card>
							<CardHeader>
								<CardTitle>Update Status</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<Select
										value={order.status}
										onValueChange={handleStatusUpdate}
										disabled={updateStatus.isPending}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="pending">Pending</SelectItem>
											<SelectItem value="confirmed">Confirmed</SelectItem>
											<SelectItem value="shipped">Shipped</SelectItem>
											<SelectItem value="delivered">Delivered</SelectItem>
											<SelectItem value="cancelled">Cancelled</SelectItem>
										</SelectContent>
									</Select>
									{updateStatus.isPending && (
										<p className="text-muted-foreground text-sm">Updating...</p>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Customer Info */}
						<Card>
							<CardHeader>
								<CardTitle>Customer Information</CardTitle>
							</CardHeader>
							<CardContent>
								{customer ? (
									<div className="space-y-3">
										<div className="flex items-center gap-2">
											<User size={16} />
											<p className="font-medium">{customer.name}</p>
										</div>
										<div>
											<p className="text-muted-foreground text-sm">Email</p>
											<p className="font-medium">{customer.email}</p>
										</div>
										<div>
											<p className="text-muted-foreground text-sm">Phone</p>
											<p className="font-medium">{customer.phone ?? "N/A"}</p>
										</div>
									</div>
								) : (
									<p>Loading customer...</p>
								)}
							</CardContent>
						</Card>

						{/* Delivery Address */}
						<Card>
							<CardHeader>
								<CardTitle>Shipping Address</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-1">
									<p className="font-medium">
										{shippingAddress.firstName} {shippingAddress.lastName}
									</p>
									<p>{shippingAddress.addressLine1}</p>
									{shippingAddress.addressLine2 && (
										<p>{shippingAddress.addressLine2}</p>
									)}
									<p>
										{shippingAddress.city}, {shippingAddress.state}{" "}
										{shippingAddress.postalCode}
									</p>
									<p>{shippingAddress.country}</p>
									<p>{shippingAddress.phone}</p>
								</div>
							</CardContent>
						</Card>

						{/* Billing Address */}
						{billingAddress && (
							<Card>
								<CardHeader>
									<CardTitle>Billing Address</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-1">
										<p className="font-medium">
											{billingAddress.firstName} {billingAddress.lastName}
										</p>
										<p>{billingAddress.addressLine1}</p>
										{billingAddress.addressLine2 && (
											<p>{billingAddress.addressLine2}</p>
										)}
										<p>
											{billingAddress.city}, {billingAddress.state}{" "}
											{billingAddress.postalCode}
										</p>
										<p>{billingAddress.country}</p>
										<p>{billingAddress.phone}</p>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
