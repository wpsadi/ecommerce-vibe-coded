"use client";

import type React from "react";

import { Header } from "@/components/header";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useCategories, useCreateProduct } from "@/hooks/use-trpc-hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	Controller,
	type ControllerRenderProps,
	useForm,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const productSchema = z.object({
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
	description: z.string().min(1, "Description is required"),
	price: z.string().min(1, "Price is required"),
	originalPrice: z.string().optional(),
	categoryId: z.string().min(1, "Category is required"),
	stock: z
		.string()
		.min(1, "Stock is required")
		.transform((val) => Number.parseInt(val)),
	specifications: z.record(z.string()).optional(),
	images: z.array(z.string()).optional(),
});

export default function AddProductPage() {
	const { user } = useAuth();
	const router = useRouter();

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		control,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(productSchema),
	});

	const { data: categories } = useCategories();
	const createProduct = useCreateProduct();

	const [specKey, setSpecKey] = useState("");
	const [specValue, setSpecValue] = useState("");

	useEffect(() => {
		if (!user || user.role !== "admin") {
			router.push("/login");
		}
	}, [user, router]);

	const addSpecification = () => {
		if (specKey && specValue) {
			const currentSpecs = watch("specifications") || {};
			setValue("specifications", { ...currentSpecs, [specKey]: specValue });
			setSpecKey("");
			setSpecValue("");
		}
	};

	const removeSpecification = (key: string) => {
		const currentSpecs = watch("specifications") || {};
		const newSpecs = { ...currentSpecs };
		delete newSpecs[key];
		setValue("specifications", newSpecs);
	};

	const onSubmit = async (data: z.infer<typeof productSchema>) => {
		try {
			await createProduct.mutateAsync(data);
			router.push("/admin/products");
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	if (!user || user.role !== "admin") {
		return null;
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-2xl">
					<div className="mb-8 flex items-center gap-4">
						<Button variant="outline" onClick={() => router.back()}>
							← Back
						</Button>
						<h1 className="font-bold text-3xl">Add New Product</h1>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Product Details</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
								<div className="grid gap-4 md:grid-cols-2">
									<div>
										<Label htmlFor="name">Product Name *</Label>
										<Input
											id="name"
											{...register("name")}
											required
											placeholder="Enter product name"
										/>
										{errors.name && (
											<p className="text-red-500 text-xs">
												{errors.name.message}
											</p>
										)}
									</div>

									<div>
										<Label htmlFor="slug">Product Slug *</Label>
										<Input
											id="slug"
											{...register("slug")}
											required
											placeholder="Enter product slug (URL-friendly)"
										/>
										{errors.slug && (
											<p className="text-red-500 text-xs">
												{errors.slug.message}
											</p>
										)}
									</div>

									<div>
										<Label htmlFor="category">Category *</Label>
										<Controller
											name="categoryId"
											control={control}
											render={({ field }) => (
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select category" />
													</SelectTrigger>
													<SelectContent>
														{categories?.map((category) => (
															<SelectItem key={category.id} value={category.id}>
																{category.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
										/>
										{errors.categoryId && (
											<p className="text-red-500 text-xs">
												{errors.categoryId.message}
											</p>
										)}
									</div>
								</div>

								<div>
									<Label htmlFor="description">Description *</Label>
									<Textarea
										id="description"
										{...register("description")}
										required
										placeholder="Enter product description"
										rows={4}
									/>
									{errors.description && (
										<p className="text-red-500 text-xs">
											{errors.description.message}
										</p>
									)}
								</div>

								<div className="grid gap-4 md:grid-cols-3">
									<div>
										<Label htmlFor="price">Price (₹) *</Label>
										<Input
											id="price"
											type="number"
											{...register("price")}
											required
											placeholder="0"
										/>
										{errors.price && (
											<p className="text-red-500 text-xs">
												{errors.price.message}
											</p>
										)}
									</div>

									<div>
										<Label htmlFor="originalPrice">Original Price (₹)</Label>
										<Input
											id="originalPrice"
											type="number"
											{...register("originalPrice")}
											placeholder="0"
										/>
									</div>

									<div>
										<Label htmlFor="stock">Stock Quantity *</Label>
										<Input
											id="stock"
											type="number"
											{...register("stock")}
											required
											placeholder="0"
										/>
										{errors.stock && (
											<p className="text-red-500 text-xs">
												{errors.stock.message}
											</p>
										)}
									</div>
								</div>

								{/* Product Images */}
								<div>
									<Label>Product Images</Label>
									<Controller
										name="images"
										control={control}
										render={({ field }) => (
											<ImageUpload
												images={field.value || []}
												onImagesChange={field.onChange}
												maxImages={5}
											/>
										)}
									/>
								</div>

								{/* Specifications */}
								<div>
									<Label>Specifications</Label>
									<div className="space-y-4">
										<div className="flex gap-2">
											<Input
												placeholder="Specification name"
												value={specKey}
												onChange={(e) => setSpecKey(e.target.value)}
											/>
											<Input
												placeholder="Specification value"
												value={specValue}
												onChange={(e) => setSpecValue(e.target.value)}
											/>
											<Button type="button" onClick={addSpecification}>
												Add
											</Button>
										</div>

										{watch("specifications") &&
											Object.entries(watch("specifications") || {}).length >
												0 && (
												<div className="rounded-lg border p-4">
													<h4 className="mb-2 font-medium">
														Added Specifications:
													</h4>
													<div className="space-y-2">
														{Object.entries(watch("specifications") || {}).map(
															([key, value]) => (
																<div
																	key={key}
																	className="flex items-center justify-between rounded bg-muted p-2"
																>
																	<span>
																		<strong>{key}:</strong> {value}
																	</span>
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		onClick={() => removeSpecification(key)}
																		className="text-red-500 hover:text-red-700"
																	>
																		Remove
																	</Button>
																</div>
															),
														)}
													</div>
												</div>
											)}
									</div>
								</div>

								<div className="flex gap-4">
									<Button
										type="submit"
										disabled={createProduct.isPending}
										className="flex-1"
									>
										{createProduct.isPending
											? "Adding Product..."
											: "Add Product"}
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => router.back()}
									>
										Cancel
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
