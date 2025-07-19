"use client";

import { Header } from "@/components/header";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-context";
import {
	useDeleteProduct,
	useLowStockProducts,
	useProducts,
} from "@/hooks/use-trpc-hooks";
import { AlertTriangle, Edit, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminProductsPage() {
	const { user } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [searchQuery, setSearchQuery] = useState("");
	const filter = searchParams.get("filter");

	// tRPC Hooks
	const { data: allProducts, isPending } = useProducts({
		search: searchQuery || undefined,
	});
	const { data: lowStockProducts } = useLowStockProducts(10);
	const deleteProduct = useDeleteProduct();

	useEffect(() => {
		if (!user || user.role !== "admin") {
			router.push("/login");
		}
	}, [user, router]);

	// Filter products based on the filter parameter
	const products =
		filter === "low-stock" ? lowStockProducts || [] : allProducts || [];

	const handleDeleteProduct = async (
		productId: string,
		productName: string,
	) => {
		try {
			await deleteProduct.mutateAsync({ id: productId });
			toast.success(`${productName} has been successfully deleted`);
		} catch (error) {
			toast.error("Failed to delete product");
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
					<div>
						<h1 className="font-bold text-3xl">Product Management</h1>
						{filter === "low-stock" && (
							<p className="mt-2 text-muted-foreground">
								Showing products with low stock
							</p>
						)}
					</div>
					<Link href="/admin/products/add">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Product
						</Button>
					</Link>
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
									placeholder="Search products..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
							<Button
								variant={filter === "low-stock" ? "default" : "outline"}
								onClick={() =>
									router.push(
										filter === "low-stock"
											? "/admin/products"
											: "/admin/products?filter=low-stock",
									)
								}
							>
								<AlertTriangle className="mr-2 h-4 w-4" />
								Low Stock
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Products Table */}
				<Card>
					<CardHeader>
						<CardTitle>Products ({products.length})</CardTitle>
					</CardHeader>
					<CardContent>
						{isPending ? (
							<div className="py-8 text-center">
								<div className="mx-auto h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
								<p className="mt-2 text-muted-foreground">
									Loading products...
								</p>
							</div>
						) : products.length === 0 ? (
							<div className="py-8 text-center">
								<p className="text-muted-foreground">
									{filter === "low-stock"
										? "No low stock products found"
										: "No products found"}
								</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Product</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Price</TableHead>
											<TableHead>Stock</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{products.map((product) => (
											<TableRow key={product.id}>
												<TableCell>
													<div className="flex items-center gap-3">
														<Image
															src={
																("images" in product &&
																	product.images &&
																	product.images[0]?.url) ||
																"/placeholder.svg"
															}
															alt={product.name}
															width={50}
															height={50}
															className="rounded object-cover"
														/>
														<div>
															<div className="font-medium">{product.name}</div>
															<div className="text-muted-foreground text-sm">
																ID: {product.id}
															</div>
														</div>
													</div>
												</TableCell>
												<TableCell>
													{product.category?.name || "No Category"}
												</TableCell>
												<TableCell>
													₹
													{("price" in product
														? Number(product.price)
														: 0
													).toLocaleString()}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														{product.stock}
														{product.stock < 10 && (
															<Badge variant="destructive" className="text-xs">
																Low Stock
															</Badge>
														)}
													</div>
												</TableCell>
												<TableCell>
													<Badge
														variant={
															product.stock > 0 ? "default" : "secondary"
														}
													>
														{product.stock > 0 ? "In Stock" : "Out of Stock"}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Link href={`/admin/products/edit/${product.id}`}>
															<Button variant="ghost" size="sm">
																<Edit className="h-4 w-4" />
															</Button>
														</Link>
														<AlertDialog>
															<AlertDialogTrigger asChild>
																<Button
																	variant="ghost"
																	size="sm"
																	className="text-red-500 hover:text-red-700"
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Delete Product
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Are you sure you want to delete "
																		{product.name}"? This action cannot be
																		undone.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Cancel</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() =>
																			handleDeleteProduct(
																				product.id,
																				product.name,
																			)
																		}
																		className="bg-red-500 hover:bg-red-600"
																		disabled={deleteProduct.isPending}
																	>
																		{deleteProduct.isPending
																			? "Deleting..."
																			: "Delete"}
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
