"use client";

import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
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
import {
	useCategories,
	useProduct,
	useUpdateProduct,
} from "@/hooks/use-trpc-hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, type ControllerRenderProps } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const productSchema = z.object({
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
	description: z.string().min(1, "Description is required"),
	price: z.string().min(1, "Price is required"),
	originalPrice: z.string().optional(),
	categoryId: z.string().min(1, "Category is required"),
	stock: z.string().min(1, "Stock is required").transform(val => parseInt(val)),
	specifications: z.record(z.string()).optional(),
	images: z.array(z.string()).optional(),
});

export default function EditProductPage() {
	const { user } = useAuth();
	const router = useRouter();
	const params = useParams();
	const productId = params.id as string;

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

	const [specKey, setSpecKey] = useState("");
	const [specValue, setSpecValue] = useState("");

	// tRPC Hooks
	const { data: product, isPending: productLoading } = useProduct(productId);
	const { data: categories, isPending: categoriesLoading } = useCategories();
	const updateProduct = useUpdateProduct();

	useEffect(() => {
		if (!user || user.role !== "admin") {
			router.push("/login");
			return;
		}
	}, [user, router]);

	useEffect(() => {
		if (product) {
			setValue("name", product.name);
			setValue("description", product.description);
			setValue("price", String(product.price));
			setValue("originalPrice", String(product.originalPrice));
			setValue("categoryId", product.categoryId);
			setValue("stock", String(product.stock));
			setValue(
				"specifications",
				product.specifications as Record<string, string>,
			);
			setValue(
				"images",
				product.images?.map((img: any) => img.url) || [],
			);
		}
	}, [product, setValue]);

	const handleAddSpec = () => {
		if (specKey && specValue) {
			const currentSpecs = watch("specifications") || {};
			setValue("specifications", { ...currentSpecs, [specKey]: specValue });
			setSpecKey("");
			setSpecValue("");
		}
	};

	const handleRemoveSpec = (key: string) => {
		const currentSpecs = watch("specifications") || {};
		const newSpecs = { ...currentSpecs };
		delete newSpecs[key];
		setValue("specifications", newSpecs);
	};

	const onSubmit = async (data: z.infer<typeof productSchema>) => {
		try {
			await updateProduct.mutateAsync({
				id: productId,
				...data,
			});
			router.push("/admin/products");
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	if (productLoading || categoriesLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="container mx-auto p-4">
			<h1 className="mb-4 font-bold text-2xl">Edit Product</h1>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<Label htmlFor="name">Product Name</Label>
						<Input id="name" {...register("name")} required />
						{errors.name && (
							<p className="text-red-500 text-xs">{errors.name.message}</p>
						)}
					</div>
					<div>
						<Label htmlFor="slug">Product Slug</Label>
						<Input id="slug" {...register("slug")} required />
						{errors.slug && (
							<p className="text-red-500 text-xs">{errors.slug.message}</p>
						)}
					</div>
					<div>
						<Label htmlFor="category">Category</Label>
						<Controller
							name="categoryId"
							control={control}
							render={({ field }) => (
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select a category" />
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
					<div>
						<Label htmlFor="price">Price</Label>
						<Input id="price" type="number" {...register("price")} required />
						{errors.price && (
							<p className="text-red-500 text-xs">{errors.price.message}</p>
						)}
					</div>
					<div>
						<Label htmlFor="originalPrice">Original Price</Label>
						<Input
							id="originalPrice"
							type="number"
							{...register("originalPrice")}
						/>
					</div>
					<div>
						<Label htmlFor="stock">Stock</Label>
						<Input id="stock" type="number" {...register("stock")} required />
						{errors.stock && (
							<p className="text-red-500 text-xs">{errors.stock.message}</p>
						)}
					</div>
				</div>
				<div>
					<Label htmlFor="description">Description</Label>
					<Textarea id="description" {...register("description")} required />
					{errors.description && (
						<p className="text-red-500 text-xs">{errors.description.message}</p>
					)}
				</div>
				<div>
					<Label>Images</Label>
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
				<div>
					<h2 className="mb-2 font-bold text-xl">Specifications</h2>
					<div className="space-y-2">
						{watch("specifications") &&
							Object.entries(watch("specifications") || {}).map(([key, value]) => (
								<div key={key} className="flex items-center gap-2">
									<Input value={key} readOnly />
									<Input value={value} readOnly />
									<Button
										type="button"
										variant="destructive"
										onClick={() => handleRemoveSpec(key)}
									>
										Remove
									</Button>
								</div>
							))}
					</div>
					<div className="mt-4 flex items-center gap-2">
						<Input
							placeholder="Specification Name"
							value={specKey}
							onChange={(e) => setSpecKey(e.target.value)}
						/>
						<Input
							placeholder="Specification Value"
							value={specValue}
							onChange={(e) => setSpecValue(e.target.value)}
						/>
						<Button type="button" onClick={handleAddSpec}>
							Add Spec
						</Button>
					</div>
				</div>
				<Button
					type="submit"
					disabled={updateProduct.isPending}
					className="w-full"
				>
					{updateProduct.isPending ? "Updating..." : "Update Product"}
				</Button>
			</form>
		</div>
	);
}
