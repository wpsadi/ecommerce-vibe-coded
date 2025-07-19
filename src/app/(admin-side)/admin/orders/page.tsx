"use client";

import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/trpc/react";
import {
	useAllOrders,
	useOrderStatistics,
	useUpdateOrderStatus,
} from "@/hooks/use-trpc-hooks";
import type { Order, OrderItem } from "@/server/db/schema";
import { Eye, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CustomerInfoProps {
	userId: string;
	addressName: string;
}

const CustomerInfo = ({ userId, addressName }: CustomerInfoProps) => {
	const { data: user, isLoading, error } = api.users.getById.useQuery({ id: userId });

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

	return (
		<div>
			<div className="font-medium">{addressName}</div>
			<div className="text-muted-foreground text-sm">
				{user?.email || "N/A"}
			</div>
		</div>
	);
};

export default function AdminOrdersPage() {
	const { user } = useAuth();
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded">("all");

	// tRPC Hooks
	const { data: allOrders, isLoading } = useAllOrders({
		search: searchQuery || undefined,
		status: statusFilter !== "all" ? (statusFilter as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded") : undefined,
	});
	const { data: orderStats } = useOrderStatistics();
	const updateOrderStatus = useUpdateOrderStatus();

	// Use tRPC data or fallback to empty array
	const orders = allOrders || [];

	useEffect(() => {
		if (!user || user.role !== "admin") {
			router.push("/login");
		}
	}, [user, router]);

	const handleStatusUpdate = async (orderId: string, status: string) => {
		try {
			await updateOrderStatus.mutateAsync({ id: orderId, status });
		} catch (error) {
			toast.error("Failed to update order status");
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

	const getPaymentStatusColor = (status: string) => {
		switch (status) {
			case "paid":
				return "bg-green-500 hover:bg-green-600";
			case "pending":
				return "bg-yellow-500 hover:bg-yellow-600";
			case "failed":
				return "bg-red-500 hover:bg-red-600";
			default:
				return "bg-gray-500 hover:bg-gray-600";
		}
	};

	

	if (!user || user.role !== "admin") {
		return null;
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center justify-between">
					<h1 className="font-bold text-3xl">Order Management</h1>
					<div className="text-muted-foreground text-sm">
						Total Orders: {orders.length}
					</div>
				</div>

				{/* Search and Filters */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Search & Filter</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex gap-4">
							<div className="relative flex-1">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
								<Input
									placeholder="Search by order ID, customer name, or email..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
							<Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded")}>
								<SelectTrigger className="w-48">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Orders</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="confirmed">Confirmed</SelectItem>
									<SelectItem value="shipped">Shipped</SelectItem>
									<SelectItem value="delivered">Delivered</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Orders Table */}
				<Card>
					<CardHeader>
						<CardTitle>Orders ({orders.length})</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Order ID</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Items</TableHead>
										<TableHead>Total</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Payment</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{orders.map((order: Order) => (
										<TableRow key={order.id}>
											<TableCell className="font-medium">{order.id}</TableCell>
											<TableCell>
												<CustomerInfo userId={order.userId} addressName={order.shippingAddress.firstName + " " + order.shippingAddress.lastName} />
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<div className="-space-x-2 flex">
														{order.items.slice(0, 3).map((item: OrderItem) => (
															<Image
																key={item.id}
																src={item.productImage || "/placeholder.svg"}
																alt={item.productName}
																width={32}
																height={32}
																className="rounded border-2 border-background"
															/>
														))}
													</div>
													<span className="text-muted-foreground text-sm">
														{order.items.length} item
														{order.items.length > 1 ? "s" : ""}
													</span>
												</div>
											</TableCell>
											<TableCell className="font-medium">
												₹{order.totalAmount.toLocaleString()}
											</TableCell>
											<TableCell>
												<Badge className={getStatusColor(order.status)}>
													{order.status.charAt(0).toUpperCase() +
														order.status.slice(1)}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge
													className={getPaymentStatusColor(order.paymentStatus)}
												>
													{order.paymentStatus.charAt(0).toUpperCase() +
														order.paymentStatus.slice(1)}
												</Badge>
											</TableCell>
											<TableCell>
												{new Date(order.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell>
												<Link href={`/admin/orders/${order.id}`}>
													<Button variant="ghost" size="sm">
														<Eye className="h-4 w-4" />
													</Button>
												</Link>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
