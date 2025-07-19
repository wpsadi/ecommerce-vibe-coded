"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { mockProducts, categories, type Product } from "@/lib/mock-data"
import { ImageUpload } from "@/components/image-upload"
import { toast } from "sonner"

export default function EditProductPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()

  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    stock: "",
    specifications: {} as Record<string, string>,
    images: [] as string[],
  })

  const [specKey, setSpecKey] = useState("")
  const [specValue, setSpecValue] = useState("")

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/login")
      return
    }

    const productId = params.id as string
    const foundProduct = mockProducts.find((p) => p.id === productId)

    if (foundProduct) {
      setProduct(foundProduct)
      setFormData({
        name: foundProduct.name,
        description: foundProduct.description,
        price: foundProduct.price.toString(),
        originalPrice: foundProduct.originalPrice?.toString() || "",
        category: foundProduct.category,
        stock: foundProduct.stock.toString(),
        specifications: foundProduct.specifications,
        images: foundProduct.images || [foundProduct.image], // Use images array or fallback to single image
      })
    }
  }, [user, router, params.id])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addSpecification = () => {
    if (specKey && specValue) {
      setFormData((prev) => ({
        ...prev,
        specifications: { ...prev.specifications, [specKey]: specValue },
      }))
      setSpecKey("")
      setSpecValue("")
    }
  }

  const removeSpecification = (key: string) => {
    setFormData((prev) => {
      const newSpecs = { ...prev.specifications }
      delete newSpecs[key]
      return { ...prev, specifications: newSpecs }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Product has been successfully updated")

      router.push("/admin/products")
    } catch (error) {
      toast.error("Failed to update product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== "admin") {
    return null
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Button onClick={() => router.push("/admin/products")}>Back to Products</Button>
          </div>
        </main>
      </div>
    )
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
            <h1 className="text-3xl font-bold">Edit Product</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    required
                    placeholder="Enter product description"
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      required
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="originalPrice">Original Price (₹)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => handleInputChange("originalPrice", e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => handleInputChange("stock", e.target.value)}
                      required
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Product Images */}
                <div>
                  <Label>Product Images</Label>
                  <ImageUpload
                    images={formData.images}
                    onImagesChange={(images) => setFormData((prev) => ({ ...prev, images }))}
                    maxImages={5}
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

                    {Object.entries(formData.specifications).length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Current Specifications:</h4>
                        <div className="space-y-2">
                          {Object.entries(formData.specifications).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between bg-muted p-2 rounded">
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
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Updating Product..." : "Update Product"}
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
