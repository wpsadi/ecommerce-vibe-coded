"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, X } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export default function AddCategoryPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    image: "",
    featured: false,
  })

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/login")
    }
  }, [user, router])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload only image files")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Please upload images smaller than 5MB")
      return
    }

    setUploading(true)

    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real app, you would upload to a cloud service
      const mockUrl = `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(file.name)}`

      setFormData((prev) => ({ ...prev, image: mockUrl }))

      toast.success("Category image uploaded successfully")
    } catch (error) {
      toast.error("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newCategory = {
        id: formData.name.toLowerCase().replace(/\s+/g, "-"),
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        image: formData.image,
        featured: formData.featured,
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      toast.success("Category has been successfully created")

      router.push("/admin/categories")
    } catch (error) {
      toast.error("Failed to create category. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => router.back()}>
              ← Back
            </Button>
            <h1 className="text-3xl font-bold">Add New Category</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      placeholder="Enter category name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="icon">Icon Emoji *</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => handleInputChange("icon", e.target.value)}
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
                    onChange={(e) => handleInputChange("description", e.target.value)}
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
                          className="rounded-lg object-cover border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file)
                          }}
                          className="hidden"
                          id="category-image-upload"
                          disabled={uploading}
                        />
                        <label
                          htmlFor="category-image-upload"
                          className={`cursor-pointer ${uploading ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium mb-1">
                            {uploading ? "Uploading..." : "Upload Category Image"}
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="featured" className="text-base font-medium">
                      Featured on Home Page
                    </Label>
                    <p className="text-sm text-muted-foreground">Display this category prominently on the home page</p>
                  </div>
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => handleInputChange("featured", checked)}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating Category..." : "Create Category"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
