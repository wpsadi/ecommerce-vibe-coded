"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import {
	useAllUsers,
	useCategories,
	useLowStockProducts,
	useOrderStatistics,
	useProducts,
} from "@/hooks/use-trpc-hooks";
import {
	AlertTriangle,
	DollarSign,
	Grid3X3,
	Package,
	ShoppingCart,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboard() {
	const { user } = useAuth();
	const router = useRouter();

	// tRPC Hooks
	const { data: products } = useProducts();
	const { data: categories } = useCategories();
	const { data: users } = useAllUsers({});
	const { data: orderStats } = useOrderStatistics();
	const { data: lowStockProducts } = useLowStockProducts(10);

	useEffect(() => {
		if (!user || user.role !== "admin") {
			router.push("/login");
		}
	}, [user, router]);

	if (!user || user.role !== "admin") {
		return null;
	}

	const totalUsers = users?.length || 0;
	const totalProducts = products?.length || 0;
	const totalOrders = orderStats?.totalOrders || 0;
	const totalRevenue = Number.parseFloat(orderStats?.totalRevenue || "0");
	const totalCategories = categories?.length || 0;
	const featuredCategories = categories?.filter((c) => c.featured).length || 0;
	const lowStockCount = lowStockProducts?.length || 0;

	const stats = [
		{
			title: "Total Users",
			value: totalUsers,
			icon: Users,
			description: `${users?.filter((u) => u.role === "admin").length || 0} admins, ${users?.filter((u) => u.role === "user").length || 0} regular`,
		},
		{
			title: "Total Products",
			value: totalProducts,
			icon: Package,
			description: "Products in catalog",
		},
		{
			title: "Total Categories",
			value: totalCategories,
			icon: Grid3X3,
			description: `${featuredCategories} featured`,
		},
		{
			title: "Total Orders",
			value: totalOrders,
			icon: ShoppingCart,
			description: "Orders placed",
		},
		{
			title: "Total Revenue",
			value: `₹${totalRevenue.toLocaleString()}`,
			icon: DollarSign,
			description: "Revenue generated",
		},
	];

	const quickActions = [
		{
			title: "Manage Categories",
			description: "Add, edit, or manage product categories",
			href: "/admin/categories",
			icon: Grid3X3,
		},
		{
			title: "Manage Products",
			description: "Add, edit, or remove products",
			href: "/admin/products",
			icon: Package,
		},
		{
			title: "Manage Orders",
			description: "View and update order status",
			href: "/admin/orders",
			icon: ShoppingCart,
		},
		{
			title: "Manage Users",
			description: "View and manage user accounts",
			href: "/admin/users",
			icon: Users,
		},
	];

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center justify-between">
					<h1 className="font-bold text-3xl">Admin Dashboard</h1>
					<div className="text-muted-foreground text-sm">
						Welcome back, {user.name}
					</div>
				</div>

				{/* Stats Grid */}
				<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
					{stats.map((stat) => (
						<Card key={stat.title}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									{stat.title}
								</CardTitle>
								<stat.icon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{stat.value}</div>
								<p className="text-muted-foreground text-xs">
									{stat.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Alerts */}
				{lowStockCount > 0 && (
					<Card className="mb-8 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
								<AlertTriangle className="h-5 w-5" />
								Low Stock Alert
							</CardTitle>
							<CardDescription className="text-orange-700 dark:text-orange-300">
								{lowStockCount} products have low stock (less than 10 items)
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href="/admin/products?filter=low-stock">
								<Button
									variant="outline"
									className="border-orange-300 bg-transparent text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900"
								>
									View Low Stock Products
								</Button>
							</Link>
						</CardContent>
					</Card>
				)}

				{/* Quick Actions */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{quickActions.map((action) => (
						<Card
							key={action.title}
							className="transition-shadow hover:shadow-md"
						>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<action.icon className="h-5 w-5" />
									{action.title}
								</CardTitle>
								<CardDescription>{action.description}</CardDescription>
							</CardHeader>
							<CardContent>
								<Link href={action.href}>
									<Button className="w-full">Manage</Button>
								</Link>
							</CardContent>
						</Card>
					))}
				</div>
			</main>
		</div>
	);
}
