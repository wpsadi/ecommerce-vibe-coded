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
import { Switch } from "@/components/ui/switch";
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
	useCategories,
	useDeleteCategory,
	useToggleCategoryFeatured,
} from "@/hooks/use-trpc-hooks";
import { Edit, Plus, Search, Star, StarOff, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
	const { user } = useAuth();
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState("");

	// tRPC Hooks
	const { data: categories, isPending } = useCategories();
	const deleteCategory = useDeleteCategory();
	const toggleFeatured = useToggleCategoryFeatured();

	useEffect(() => {
		if (!user || user.role !== "admin") {
			router.push("/login");
		}
	}, [user, router]);

	// Filter categories based on search
	const filteredCategories =
		categories?.filter(
			(category) =>
				category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				category.description.toLowerCase().includes(searchQuery.toLowerCase()),
		) || [];

	const handleDeleteCategory = async (
		categoryId: string,
		categoryName: string,
	) => {
		try {
			await deleteCategory.mutateAsync({ id: categoryId });
			toast.success(`${categoryName} has been successfully deleted`);
		} catch (error) {
			toast.error("Failed to delete category");
		}
	};

	const handleToggleFeatured = async (
		categoryId: string,
		featured: boolean,
	) => {
		try {
			await toggleFeatured.mutateAsync({ id: categoryId, featured });
		} catch (error) {
			toast.error("Failed to update category");
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
						<h1 className="font-bold text-3xl">Category Management</h1>
						<p className="mt-2 text-muted-foreground">
							Manage product categories and their settings
						</p>
					</div>
					<Link href="/admin/categories/add">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Category
						</Button>
					</Link>
				</div>

				{/* Search */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Search & Filter</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
							<Input
								placeholder="Search categories by name or description..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Categories Table */}
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Category</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>Featured</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isPending ? (
								<TableRow>
									<TableCell colSpan={4} className="py-8 text-center">
										Loading categories...
									</TableCell>
								</TableRow>
							) : filteredCategories.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className="py-8 text-center">
										{searchQuery
											? "No categories found matching your search"
											: "No categories found"}
									</TableCell>
								</TableRow>
							) : (
								filteredCategories.map((category) => (
									<TableRow key={category.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-muted">
													{category.image ? (
														<Image
															src={category.image}
															alt={category.name}
															width={48}
															height={48}
															className="h-full w-full object-cover"
														/>
													) : (
														<span className="text-2xl">
															{category.icon || "📁"}
														</span>
													)}
												</div>
												<div>
													<h3 className="font-medium">{category.name}</h3>
													<div className="text-muted-foreground text-sm">
														ID: {category.id}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<p className="line-clamp-2 text-muted-foreground text-sm">
												{category.description}
											</p>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Switch
													checked={category.featured}
													onCheckedChange={(featured) =>
														handleToggleFeatured(category.id, featured)
													}
													disabled={toggleFeatured.isPending}
												/>
												{category.featured && (
													<Badge variant="secondary" className="gap-1">
														<Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
														Featured
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Link href={`/admin/categories/edit/${category.id}`}>
													<Button variant="outline" size="sm">
														<Edit className="h-4 w-4" />
													</Button>
												</Link>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button variant="outline" size="sm">
															<Trash2 className="h-4 w-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																Delete Category
															</AlertDialogTitle>
															<AlertDialogDescription>
																Are you sure you want to delete "{category.name}
																"? This action cannot be undone.
																<span className="mt-2 block text-red-600">
																	Products in this category will not be deleted,
																	but they may lose their category assignment.
																</span>
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Cancel</AlertDialogCancel>
															<AlertDialogAction
																onClick={() =>
																	handleDeleteCategory(
																		category.id,
																		category.name,
																	)
																}
																disabled={deleteCategory.isPending}
																className="bg-red-600 hover:bg-red-700"
															>
																{deleteCategory.isPending
																	? "Deleting..."
																	: "Delete"}
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</Card>
			</main>
		</div>
	);
}
