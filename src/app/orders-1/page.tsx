"use client";

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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useOrders } from "@/hooks/use-trpc-hooks";
import Link from "next/link";
import { useState } from "react";

export default function OrdersPage() {
	const [status, setStatus] = useState<string | undefined>(undefined);
	const { data: orders, isPending } = useOrders({
		status: status as
			| "pending"
			| "confirmed"
			| "shipped"
			| "delivered"
			| "cancelled"
			| "refunded"
			| undefined,
	});

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center justify-between">
					<h1 className="font-bold text-3xl">My Orders</h1>
					<Select
						onValueChange={(value) =>
							setStatus(value === "all" ? undefined : value)
						}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="confirmed">Confirmed</SelectItem>
							<SelectItem value="shipped">Shipped</SelectItem>
							<SelectItem value="delivered">Delivered</SelectItem>
							<SelectItem value="cancelled">Cancelled</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Card>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Order ID</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Total</TableHead>
									<TableHead />
								</TableRow>
							</TableHeader>
							<TableBody>
								{isPending ? (
									[...Array(5)].map((_, i) => (
										<TableRow key={`loading-row-${i}`}>
											<TableCell colSpan={5} className="h-16 text-center">
												Loading...
											</TableCell>
										</TableRow>
									))
								) : orders && orders.length > 0 ? (
									orders.map((order) => (
										<TableRow key={order.id}>
											<TableCell className="font-medium">
												#{order.orderNumber}
											</TableCell>
											<TableCell>
												{new Date(order.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														order.status === "delivered"
															? "default"
															: "secondary"
													}
												>
													{order.status}
												</Badge>
											</TableCell>
											<TableCell>
												₹{Number(order.totalAmount).toFixed(2)}
											</TableCell>
											<TableCell className="text-right">
												<Link href={`/orders/${order.id}`}>
													<Button variant="outline" size="sm">
														View Details
													</Button>
												</Link>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={5} className="h-24 text-center">
											No orders found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
