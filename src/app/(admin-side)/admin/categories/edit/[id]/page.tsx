"use client";

import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	useAssignProductsToCategory,
	useCategory,
	useProducts,
	useUpdateCategory,
} from "@/hooks/use-trpc-hooks";
import { Loader2, Package, Upload, X } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const categoryFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
	description: z.string().optional(),
	icon: z.string().optional(),
	image: z.string().optional(),
	featured: z.boolean().optional(),
	active: z.boolean().optional(),
	sortOrder: z.number().optional(),
	metaTitle: z.string().optional(),
	metaDescription: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function EditCategoryPage() {
	const { id: categoryId } = useParams() as { id: string };
	const router = useRouter();

	const {
		data: category,
		isPending: isPendingCategory,
		isError: isErrorCategory,
	} = useCategory(categoryId);

	const { data: categoryProducts, isPending: isPendingCategoryProducts } =
		useProducts({ categoryId: categoryId });

	const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
	const [uploading, setUploading] = useState(false);
	const [formData, setFormData] = useState<CategoryFormValues>({
		name: "",
		slug: "",
		description: "",
		icon: "",
		image: "",
		featured: false,
		active: true,
		sortOrder: 0,
		metaTitle: "",
		metaDescription: "",
	});

	useEffect(() => {
		if (category) {
			setFormData({
				name: category.name,
				slug: category.slug,
				description: category.description ?? "",
				icon: category.icon ?? "",
				image: category.image ?? "",
				featured: category.featured,
				active: category.active,
				sortOrder: category.sortOrder,
				metaTitle: category.metaTitle ?? "",
				metaDescription: category.metaDescription ?? "",
			});
		}
	}, [category]);

	useEffect(() => {
		if (categoryProducts) {
			setSelectedProducts(categoryProducts.map((p) => p.id));
		}
	}, [categoryProducts]);

	const updateCategoryMutation = useUpdateCategory();
	const assignProductsToCategory = useAssignProductsToCategory();

	const handleInputChange = (field: keyof CategoryFormValues, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Basic validation
		if (!formData.name.trim()) {
			toast.error("Name is required");
			return;
		}
		if (!formData.slug.trim()) {
			toast.error("Slug is required");
			return;
		}

		try {
			await updateCategoryMutation.mutateAsync({
				id: categoryId,
				...formData,
			});
			router.push("/admin/categories");
		} catch (error) {
			// Error is already handled by the hook
		}
	};

	const handleImageUpload = async (file: File | undefined) => {
		if (!file) return;
		setUploading(true);
		const formData = new FormData();
		formData.append("file", file);

		try {
			const response = await fetch(`/api/upload?filename=${file.name}`, {
				method: "POST",
				body: file,
				headers: {
					"Content-Type": file.type,
				},
			});

			if (!response.ok) {
				throw new Error("Image upload failed");
			}

			const data = await response.json();
			handleInputChange("image", data.url);
			toast.success("Image uploaded successfully");
		} catch (err) {
			toast.error("Image upload failed. Please try again.");
		} finally {
			setUploading(false);
		}
	};

	const {
		data: products = [],
		isPending: isPendingProducts,
		isError: isErrorProducts,
	} = useProducts();

	const handleProductSelection = (productId: string, checked: boolean) => {
		setSelectedProducts((prev) =>
			checked ? [...prev, productId] : prev.filter((id) => id !== productId),
		);
	};

	const handleAssignProducts = async () => {
		try {
			await assignProductsToCategory.mutateAsync({
				categoryId,
				productIds: selectedProducts,
			});
		} catch (error) {
			// Error handled by hook
		}
	};

	if (isPendingCategory) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (isErrorCategory || !category) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4">
				<h1 className="font-bold text-2xl">Category Not Found</h1>
				<Button onClick={() => router.push("/admin/categories")}>
					Back to Categories
				</Button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-4xl">
					<div className="mb-8 flex items-center justify-between">
						<div>
							<h1 className="font-bold text-3xl">Edit Category</h1>
							<p className="text-muted-foreground">
								Manage your category details and associated products.
							</p>
						</div>
						<Button variant="outline" onClick={() => router.back()}>
							← Back
						</Button>
					</div>

					<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
						<div className="lg:col-span-2">
							<form onSubmit={onSubmit} className="space-y-8">
								<Card>
									<CardHeader>
										<CardTitle>Category Details</CardTitle>
									</CardHeader>
									<CardContent className="space-y-6">
										<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="name">Category Name</Label>
												<Input
													id="name"
													placeholder="e.g. Electronics"
													value={formData.name}
													onChange={(e) => handleInputChange("name", e.target.value)}
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="slug">Slug</Label>
												<Input
													id="slug"
													placeholder="e.g. electronics"
													value={formData.slug}
													onChange={(e) => handleInputChange("slug", e.target.value)}
													required
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="description">Description</Label>
											<Textarea
												id="description"
												placeholder="A brief description of the category."
												value={formData.description || ""}
												onChange={(e) => handleInputChange("description", e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label>Category Image</Label>
											<div>
												{formData.image ? (
													<div className="relative h-48 w-full">
														<Image
															src={formData.image}
															alt="Category Image"
															fill
															className="rounded-md object-cover"
														/>
														<Button
															type="button"
															variant="destructive"
															size="icon"
															className="absolute top-2 right-2 h-6 w-6"
															onClick={() => handleInputChange("image", "")}
														>
															<X className="h-4 w-4" />
														</Button>
													</div>
												) : (
													<div className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed">
														<input
															type="file"
															id="image-upload"
															className="hidden"
															accept="image/*"
															onChange={(e) =>
																handleImageUpload(e.target.files?.[0])
															}
															disabled={uploading}
														/>
														<label
															htmlFor="image-upload"
															className="flex h-full w-full cursor-pointer flex-col items-center justify-center"
														>
															{uploading ? (
																<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
															) : (
																<>
																	<Upload className="mb-2 h-8 w-8 text-muted-foreground" />
																	<p>Upload an image</p>
																</>
															)}
														</label>
													</div>
												)}
											</div>
										</div>
									</CardContent>
									<CardFooter>
										<Button
											type="submit"
											disabled={updateCategoryMutation.isPending}
										>
											{updateCategoryMutation.isPending
												? "Saving..."
												: "Save Changes"}
										</Button>
									</CardFooter>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Status</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
											<div className="space-y-0.5">
												<Label>Active</Label>
												<p className="text-muted-foreground text-sm">
													Inactive categories are hidden from the store.
												</p>
											</div>
											<Switch
												checked={formData.active}
												onCheckedChange={(checked) => handleInputChange("active", checked)}
											/>
										</div>
										<div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
											<div className="space-y-0.5">
												<Label>Featured</Label>
												<p className="text-muted-foreground text-sm">
													Featured categories appear on the homepage.
												</p>
											</div>
											<Switch
												checked={formData.featured}
												onCheckedChange={(checked) => handleInputChange("featured", checked)}
											/>
										</div>
									</CardContent>
								</Card>
							</form>
						</div>

						<div className="space-y-8">
							<Card>
								<CardHeader>
									<CardTitle>Products</CardTitle>
									<CardDescription>
										Assign products to this category.
									</CardDescription>
								</CardHeader>
								<CardContent>
									{isPendingProducts || isPendingCategoryProducts ? (
										<div className="py-8 text-center">
											<Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
											<p className="mt-2 text-muted-foreground">
												Loading products...
											</p>
										</div>
									) : isErrorProducts ? (
										<div className="py-8 text-center text-destructive">
											<p>Failed to load products.</p>
										</div>
									) : products.length === 0 ? (
										<div className="py-8 text-center">
											<Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
											<h3 className="font-semibold text-lg">
												No Products Found
											</h3>
											<p className="text-muted-foreground">
												No products have been created yet.
											</p>
										</div>
									) : (
										<div className="max-h-96 space-y-2 overflow-y-auto pr-2">
											{products.map((product) => (
												<div
													key={product.id}
													className="flex items-center space-x-3 rounded-lg border p-2"
												>
													<Checkbox
														id={product.id}
														checked={selectedProducts.includes(product.id)}
														onCheckedChange={(checked) =>
															handleProductSelection(product.id, !!checked)
														}
													/>
													<div className="relative h-12 w-12 flex-shrink-0">
														{/* 
                              TODO: The 'product' type from useProducts doesn't include images. 
                              Update the 'getAllProducts' service in 'src/lib/products.ts' 
                              to include the images relation.
                            */}
													</div>
													<div className="flex-1">
														<Label
															htmlFor={product.id}
															className="cursor-pointer font-medium text-sm"
														>
															{product.name}
														</Label>
													</div>
												</div>
											))}
										</div>
									)}
								</CardContent>
								{products.length > 0 && (
									<CardFooter>
										<Button
											className="w-full"
											onClick={handleAssignProducts}
											disabled={assignProductsToCategory.isPending}
										>
											{assignProductsToCategory.isPending
												? "Assigning..."
												: `Assign ${selectedProducts.length} Products`}
										</Button>
									</CardFooter>
								)}
							</Card>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
