"use client"

import type React from "react"

import { useState, useCallback } from "react"
import Image from "next/image"
import { Upload, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      if (images.length + files.length > maxImages) {
        toast.error(`You can only upload up to ${maxImages} images`)
        return
      }

      setUploading(true)

      try {
        const newImages: string[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]

          // Validate file type
          if (!file.type.startsWith("image/")) {
            toast.error("Please upload only image files")
            continue
          }

          // Validate file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            toast.error("Please upload images smaller than 5MB")
            continue
          }

          // In a real app, you would upload to a cloud service like AWS S3, Cloudinary, etc.
          // For demo purposes, we'll create a mock URL
          const mockUrl = `/placeholder.svg?height=300&width=300&text=${encodeURIComponent(file.name)}`
          newImages.push(mockUrl)

          // Simulate upload delay
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        onImagesChange([...images, ...newImages])

        toast.success(`${newImages.length} image(s) uploaded successfully`)
      } catch (error) {
        toast.error("Failed to upload images. Please try again.")
      } finally {
        setUploading(false)
      }
    },
    [images, maxImages, onImagesChange],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      handleFileUpload(e.dataTransfer.files)
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
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
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">{uploading ? "Uploading..." : "Upload Product Images"}</h3>
              <p className="text-muted-foreground mb-4">Drag and drop images here, or click to select files</p>
              <p className="text-sm text-muted-foreground">
                Supports: JPG, PNG, GIF up to 5MB each (Max {maxImages} images)
              </p>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative overflow-hidden rounded">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Product image ${index + 1}`}
                    fill
                    className="object-cover"
                  />

                  {/* Primary badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}

                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Move buttons */}
                  <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

                <p className="text-xs text-center mt-2 text-muted-foreground">
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
                  className="aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 rounded transition-colors"
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
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground text-center">Add More</span>
                </label>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Instructions */}
      {images.length > 0 && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• The first image will be used as the primary product image</p>
          <p>• Use the arrow buttons to reorder images</p>
          <p>• Click the X button to remove an image</p>
        </div>
      )}
    </div>
  )
}
