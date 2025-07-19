"use client";

import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { useUser, useUserOrders } from "@/hooks/use-trpc-hooks";
import {
	Calendar,
	Mail,
	Phone,
	ShoppingBag,
	ShoppingCart,
	User,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminUserDetailsPage() {
	const { user: authUser } = useAuth();
	const router = useRouter();
	const params = useParams();
	const userId = params.id as string;

	const { data: userData, isPending: userLoading } = useUser(userId);
	const { data: userOrders, isPending: ordersLoading } = useUserOrders(userId);

	useEffect(() => {
		if (!authUser || authUser.role !== "admin") {
			router.push("/login");
		}
	}, [authUser, router]);

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

	if (userLoading || ordersLoading) {
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

	if (!userData) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">User Not Found</h1>
						<Button onClick={() => router.push("/admin/users")}>
							Back to Users
						</Button>
					</div>
				</main>
			</div>
		);
	}

	const totalSpent =
		userOrders?.reduce(
			(sum, order) => sum + Number.parseFloat(order.totalAmount),
			0,
		) ?? 0;

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center gap-4">
					<Button variant="outline" onClick={() => router.back()}>
						← Back
					</Button>
					<h1 className="font-bold text-3xl">User Details</h1>
				</div>

				<div className="grid gap-8 lg:grid-cols-3">
					{/* User Info */}
					<Card className="lg:col-span-1">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User />
								User Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-4">
								<Image
									src={userData.image ?? "/placeholder.svg"}
									alt={userData.name ?? "User"}
									width={80}
									height={80}
									className="rounded-full"
								/>
								<div>
									<h2 className="font-bold text-xl">{userData.name}</h2>
									<p className="text-muted-foreground">{userData.email}</p>
								</div>
							</div>
							<div className="space-y-2">
								<div>
									<p className="text-muted-foreground text-sm">Name</p>
									<p className="font-medium">{userData.name}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">Email</p>
									<p className="flex items-center gap-2 font-medium">
										<Mail size={16} /> {userData.email}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">Phone</p>
									<p className="flex items-center gap-2 font-medium">
										<Phone size={16} /> {userData.phone ?? "N/A"}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">Joined</p>
									<p className="flex items-center gap-2 font-medium">
										<Calendar size={16} />{" "}
										{new Date(userData.createdAt).toLocaleDateString()}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">Status</p>
									<Badge
										className={userData.blocked ? "bg-red-500" : "bg-green-500"}
									>
										{userData.blocked ? "Blocked" : "Active"}
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Stats */}
					<div className="space-y-8 lg:col-span-2">
						<div className="grid gap-8 md:grid-cols-2">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<ShoppingBag />
										Order History
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="font-bold text-3xl">
										{userOrders?.length ?? 0}
									</p>
									<p className="text-muted-foreground">Total Orders</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<ShoppingCart />
										Spending
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="font-bold text-3xl">${totalSpent.toFixed(2)}</p>
									<p className="text-muted-foreground">Total Spent</p>
								</CardContent>
							</Card>
						</div>

						{/* Tabs for Orders/Cart */}
						<Tabs defaultValue="orders">
							<TabsList>
								<TabsTrigger value="orders">Recent Orders</TabsTrigger>
							</TabsList>
							<TabsContent value="orders">
								<Card>
									<CardContent className="p-0">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Order ID</TableHead>
													<TableHead>Date</TableHead>
													<TableHead>Status</TableHead>
													<TableHead className="text-right">Total</TableHead>
													<TableHead>Action</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{userOrders?.map((order) => (
													<TableRow key={order.id}>
														<TableCell className="font-medium">
															#{order.id.slice(-6)}
														</TableCell>
														<TableCell>
															{new Date(order.createdAt).toLocaleDateString()}
														</TableCell>
														<TableCell>
															<Badge className={getStatusColor(order.status)}>
																{order.status}
															</Badge>
														</TableCell>
														<TableCell className="text-right">
															${Number.parseFloat(order.totalAmount).toFixed(2)}
														</TableCell>
														<TableCell>
															<Button
																variant="outline"
																size="sm"
																onClick={() =>
																	router.push(`/admin/orders/${order.id}`)
																}
															>
																View
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</main>
		</div>
	);
}
