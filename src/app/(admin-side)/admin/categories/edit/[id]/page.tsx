"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { Upload, X, Package } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { categories, mockProducts, type Category, type Product } from "@/lib/mock-data"

export default function EditCategoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    image: "",
    featured: false,
  })
  const [assignedProducts, setAssignedProducts] = useState<string[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/login")
      return
    }

    const categoryId = params.id as string
    const foundCategory = categories.find((c) => c.id === categoryId)

    if (foundCategory) {
      setCategory(foundCategory)
      setFormData({
        name: foundCategory.name,
        description: foundCategory.description,
        icon: foundCategory.icon,
        image: foundCategory.image || "",
        featured: foundCategory.featured,
      })

      // Get products assigned to this category
      const categoryProducts = mockProducts.filter((p) => p.categoryId === categoryId)
      setAssignedProducts(categoryProducts.map((p) => p.id))

      // Get all products for assignment
      setAvailableProducts(mockProducts)
    }
  }, [user, router, params.id])

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
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockUrl = `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(file.name)}`

      setFormData((prev) => ({ ...prev, image: mockUrl }))

      toast.success("Category image uploaded successfully")
    } catch (error) {
      toast.error("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleProductAssignment = (productId: string, assigned: boolean) => {
    if (assigned) {
      setAssignedProducts((prev) => [...prev, productId])
    } else {
      setAssignedProducts((prev) => prev.filter((id) => id !== productId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Category has been successfully updated")

      router.push("/admin/categories")
    } catch (error) {
      toast.error("Failed to update category. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== "admin") {
    return null
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
            <Button onClick={() => router.push("/admin/categories")}>Back to Categories</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => router.back()}>
              ← Back
            </Button>
            <h1 className="text-3xl font-bold">Edit Category</h1>
          </div>

          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Category Details</TabsTrigger>
              <TabsTrigger value="products">Assign Products ({assignedProducts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
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
                        <p className="text-sm text-muted-foreground">
                          Display this category prominently on the home page
                        </p>
                      </div>
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => handleInputChange("featured", checked)}
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? "Updating Category..." : "Update Category"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Assign Products to Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availableProducts.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No products available</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {availableProducts.map((product) => (
                          <div key={product.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                            <Checkbox
                              id={product.id}
                              checked={assignedProducts.includes(product.id)}
                              onCheckedChange={(checked) => handleProductAssignment(product.id, checked as boolean)}
                            />
                            <Image
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              width={60}
                              height={60}
                              className="rounded object-cover"
                            />
                            <div className="flex-1">
                              <Label htmlFor={product.id} className="font-medium cursor-pointer">
                                {product.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">₹{product.price.toLocaleString()}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{product.category}</Badge>
                                <Badge variant={product.stock > 0 ? "default" : "secondary"}>
                                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {assignedProducts.length} products assigned to this category
                      </p>
                      <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Saving..." : "Save Product Assignments"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
