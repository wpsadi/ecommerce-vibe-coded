"use client";

import type React from "react";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useCreateCategory } from "@/hooks/use-trpc-hooks";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AddCategoryPage() {
	const { user } = useAuth();
	const router = useRouter();

	const [uploading, setUploading] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		slug: "",
		description: "",
		icon: "",
		image: "",
		featured: false,
	});

	// tRPC Hooks
	const createCategory = useCreateCategory();

	useEffect(() => {
		if (!user || user.role !== "admin") {
			router.push("/login");
		}
	}, [user, router]);

	// Auto-generate slug from name
	useEffect(() => {
		if (formData.name && !formData.slug) {
			const slug = formData.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "");
			setFormData((prev) => ({ ...prev, slug }));
		}
	}, [formData.name, formData.slug]);

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleImageUpload = async (file: File) => {
		if (!file.type.startsWith("image/")) {
			toast.error("Please upload only image files");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error("Please upload images smaller than 5MB");
			return;
		}

		setUploading(true);

		try {
			// Simulate upload delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// In a real app, you would upload to a cloud service
			const mockUrl = `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(file.name)}`;

			setFormData((prev) => ({ ...prev, image: mockUrl }));

			toast.success("Category image uploaded successfully");
		} catch (error) {
			toast.error("Failed to upload image. Please try again.");
		} finally {
			setUploading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			toast.error("Category name is required");
			return;
		}

		try {
			await createCategory.mutateAsync({
				name: formData.name.trim(),
				slug:
					formData.slug.trim() ||
					formData.name
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-")
						.replace(/^-+|-+$/g, ""),
				description: formData.description.trim(),
				icon: formData.icon.trim(),
				image: formData.image,
				featured: formData.featured,
			});

			router.push("/admin/categories");
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
						<h1 className="font-bold text-3xl">Add New Category</h1>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Category Details</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="grid gap-4 md:grid-cols-2">
									<div>
										<Label htmlFor="name">Category Name *</Label>
										<Input
											id="name"
											value={formData.name}
											onChange={(e) =>
												handleInputChange("name", e.target.value)
											}
											required
											placeholder="Enter category name"
										/>
									</div>

									<div>
										<Label htmlFor="icon">Icon Emoji *</Label>
										<Input
											id="icon"
											value={formData.icon}
											onChange={(e) =>
												handleInputChange("icon", e.target.value)
											}
											required
											placeholder="📱"
											maxLength={2}
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="description">Description *</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) =>
											handleInputChange("description", e.target.value)
										}
										required
										placeholder="Enter category description"
										rows={3}
									/>
								</div>

								{/* Category Image Upload */}
								<div>
									<Label>Category Image</Label>
									<div className="mt-2">
										{formData.image ? (
											<div className="relative inline-block">
												<Image
													src={formData.image || "/placeholder.svg"}
													alt="Category preview"
													width={200}
													height={120}
													className="rounded-lg border object-cover"
												/>
												<Button
													type="button"
													variant="destructive"
													size="sm"
													className="-top-2 -right-2 absolute h-6 w-6 p-0"
													onClick={() =>
														setFormData((prev) => ({ ...prev, image: "" }))
													}
												>
													<X className="h-3 w-3" />
												</Button>
											</div>
										) : (
											<div className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-8 text-center transition-colors hover:border-muted-foreground/50">
												<input
													type="file"
													accept="image/*"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) handleImageUpload(file);
													}}
													className="hidden"
													id="category-image-upload"
													disabled={uploading}
												/>
												<label
													htmlFor="category-image-upload"
													className={`cursor-pointer ${uploading ? "cursor-not-allowed opacity-50" : ""}`}
												>
													<Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
													<p className="mb-1 font-medium text-sm">
														{uploading
															? "Uploading..."
															: "Upload Category Image"}
													</p>
													<p className="text-muted-foreground text-xs">
														PNG, JPG, GIF up to 5MB
													</p>
												</label>
											</div>
										)}
									</div>
								</div>

								{/* Featured Toggle */}
								<div className="flex items-center justify-between rounded-lg border p-4">
									<div>
										<Label htmlFor="featured" className="font-medium text-base">
											Featured on Home Page
										</Label>
										<p className="text-muted-foreground text-sm">
											Display this category prominently on the home page
										</p>
									</div>
									<Switch
										id="featured"
										checked={formData.featured}
										onCheckedChange={(checked) =>
											handleInputChange("featured", checked)
										}
									/>
								</div>

								<div className="flex gap-4">
									<Button
										type="submit"
										disabled={createCategory.isPending}
										className="flex-1"
									>
										{createCategory.isPending
											? "Creating Category..."
											: "Create Category"}
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
