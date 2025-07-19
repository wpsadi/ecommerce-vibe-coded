"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface ImageUploadProps {
	images: string[];
	onImagesChange: (images: string[]) => void;
	maxImages?: number;
}

export function ImageUpload({
	images,
	onImagesChange,
	maxImages = 5,
}: ImageUploadProps) {
	const [uploading, setUploading] = useState(false);

	const handleFileUpload = useCallback(
		async (files: FileList | null) => {
			if (!files || files.length === 0) return;

			if (images.length + files.length > maxImages) {
				toast.error(`You can only upload up to ${maxImages} images`);
				return;
			}

			setUploading(true);

			try {
				const newImages: string[] = [];

				for (let i = 0; i < files.length; i++) {
					const file = files[i];

					if (!file) continue;

					// Validate file type
					if (!file.type.startsWith("image/")) {
						toast.error("Please upload only image files");
						continue;
					}

					// Validate file size (5MB limit)
					if (file.size > 5 * 1024 * 1024) {
						toast.error("Please upload images smaller than 5MB");
						continue;
					}

					// Generate unique filename
					const timestamp = Date.now();
					const randomId = Math.random().toString(36).substring(2, 15);
					const fileExtension = file.name.split(".").pop() || "jpg";
					const filename = `product-${timestamp}-${randomId}.${fileExtension}`;

					// Upload to Vercel Blob
					const uploadResponse = await fetch(
						`/api/upload?filename=${encodeURIComponent(filename)}`,
						{
							method: "POST",
							body: file,
							headers: {
								"Content-Type": file.type,
							},
						},
					);

					if (!uploadResponse.ok) {
						const errorData = await uploadResponse.json();
						throw new Error(errorData.error || "Upload failed");
					}

					const uploadData = await uploadResponse.json();
					newImages.push(uploadData.url);
				}

				onImagesChange([...images, ...newImages]);

				toast.success(`${newImages.length} image(s) uploaded successfully`);
			} catch (error) {
				console.error("Upload error:", error);
				toast.error("Failed to upload images. Please try again.");
			} finally {
				setUploading(false);
			}
		},
		[images, maxImages, onImagesChange],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			handleFileUpload(e.dataTransfer.files);
		},
		[handleFileUpload],
	);

	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	}, []);

	const removeImage = (index: number) => {
		const newImages = images.filter((_, i) => i !== index);
		onImagesChange(newImages);
	};

	const moveImage = (fromIndex: number, toIndex: number) => {
		const newImages = [...images];
		const [movedImage] = newImages.splice(fromIndex, 1);
		if (movedImage) {
			newImages.splice(toIndex, 0, movedImage);
			onImagesChange(newImages);
		}
	};

	return (
		<div className="space-y-4">
			{/* Upload Area */}
			<Card>
				<CardContent className="p-6">
					<div
						className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-8 text-center transition-colors hover:border-muted-foreground/50"
						onDrop={handleDrop}
						onDragOver={handleDragOver}
					>
						<input
							type="file"
							multiple
							accept="image/*"
							onChange={(e) => handleFileUpload(e.target.files)}
							className="hidden"
							id="image-upload"
							disabled={uploading || images.length >= maxImages}
						/>
						<label
							htmlFor="image-upload"
							className={`cursor-pointer ${uploading || images.length >= maxImages ? "cursor-not-allowed opacity-50" : ""}`}
						>
							<Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<h3 className="mb-2 font-medium text-lg">
								{uploading ? "Uploading..." : "Upload Product Images"}
							</h3>
							<p className="mb-4 text-muted-foreground">
								Drag and drop images here, or click to select files
							</p>
							<p className="text-muted-foreground text-sm">
								Supports: JPG, PNG, GIF up to 5MB each (Max {maxImages} images)
							</p>
						</label>
					</div>
				</CardContent>
			</Card>

			{/* Image Preview Grid */}
			{images.length > 0 && (
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
					{images.map((image, index) => (
						<Card key={`image-${index}`} className="group relative">
							<CardContent className="p-2">
								<div className="relative aspect-square overflow-hidden rounded">
									<Image
										src={image || "/placeholder.svg"}
										alt={`Product image ${index + 1}`}
										fill
										className="object-cover"
									/>

									{/* Primary badge */}
									{index === 0 && (
										<div className="absolute top-2 left-2 rounded bg-primary px-2 py-1 text-primary-foreground text-xs">
											Primary
										</div>
									)}

									{/* Remove button */}
									<Button
										variant="destructive"
										size="sm"
										className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
										onClick={() => removeImage(index)}
									>
										<X className="h-3 w-3" />
									</Button>

									{/* Move buttons */}
									<div className="absolute bottom-2 left-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										{index > 0 && (
											<Button
												variant="secondary"
												size="sm"
												className="h-6 w-6 p-0 text-xs"
												onClick={() => moveImage(index, index - 1)}
											>
												←
											</Button>
										)}
										{index < images.length - 1 && (
											<Button
												variant="secondary"
												size="sm"
												className="h-6 w-6 p-0 text-xs"
												onClick={() => moveImage(index, index + 1)}
											>
												→
											</Button>
										)}
									</div>
								</div>

								<p className="mt-2 text-center text-muted-foreground text-xs">
									Image {index + 1}
									{index === 0 && " (Primary)"}
								</p>
							</CardContent>
						</Card>
					))}

					{/* Add more button */}
					{images.length < maxImages && (
						<Card className="border-dashed">
							<CardContent className="p-2">
								<label
									htmlFor="image-upload-more"
									className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded transition-colors hover:bg-accent/50"
								>
									<input
										type="file"
										multiple
										accept="image/*"
										onChange={(e) => handleFileUpload(e.target.files)}
										className="hidden"
										id="image-upload-more"
										disabled={uploading}
									/>
									<Plus className="mb-2 h-8 w-8 text-muted-foreground" />
									<span className="text-center text-muted-foreground text-xs">
										Add More
									</span>
								</label>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* Instructions */}
			{images.length > 0 && (
				<div className="space-y-1 text-muted-foreground text-sm">
					<p>• The first image will be used as the primary product image</p>
					<p>• Use the arrow buttons to reorder images</p>
					<p>• Click the X button to remove an image</p>
				</div>
			)}
		</div>
	);
}
