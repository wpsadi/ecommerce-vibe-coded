"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Package, ArrowLeft, Grid, List, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useCategories } from "@/hooks/use-trpc-hooks"
import { cn } from "@/lib/utils"

type Category = {
  id: string
  name: string
  description?: string
  icon?: string
  slug: string
  parentId?: string | null
  productCount: number
}

export default function CategoriesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // tRPC Hook
  const { data: categories, isLoading, error } = useCategories()

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const parentCategories = filteredCategories.filter(cat => !cat.parentId)
  const getSubcategories = (parentId: string) =>
    filteredCategories.filter(cat => cat.parentId === parentId)

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Error loading categories</h2>
          <p className="mb-4 text-gray-600">{error.message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-gray-200" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <CategorySkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Categories</h1>
              <p className="text-gray-600">
                Explore our product categories ({filteredCategories.length} total)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* View Mode */}
            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Message */}
        {searchTerm && (
          <div className="mb-6 rounded-lg border bg-blue-50 p-4">
            <p className="text-blue-700">
              Showing {filteredCategories.length} categories matching "{searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                Clear
              </Button>
            </p>
          </div>
        )}

        {/* Categories Grid */}
        {parentCategories.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium">No categories found</h3>
            <p className="mb-6 text-gray-600">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No categories available at the moment"
              }
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {parentCategories.map((category) => {
              const subcategories = getSubcategories(category.id)

              return (
                <CategorySection
                  key={category.id}
                  category={category}
                  subcategories={subcategories}
                  viewMode={viewMode}
                />
              )
            })}
          </div>
        )}

        {/* Quick Stats */}
        {!searchTerm && categories && categories.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold">Category Statistics</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Total Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-3xl font-bold text-blue-600">
                    {categories.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Total Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-3xl font-bold text-green-600">
                    {categories.reduce((total, cat) => total + cat.productCount, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Main Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-3xl font-bold text-purple-600">
                    {parentCategories.length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CategorySection({
  category,
  subcategories,
  viewMode
}: {
  category: Category
  subcategories: Category[]
  viewMode: "grid" | "list"
}) {
  return (
    <div>
      {/* Parent Category */}
      <CategoryCard category={category} viewMode={viewMode} isParent />

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-700">
            {category.name} Subcategories
          </h3>
          <div className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-3"
          )}>
            {subcategories.map((subcategory) => (
              <CategoryCard
                key={subcategory.id}
                category={subcategory}
                viewMode={viewMode}
                isParent={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryCard({
  category,
  viewMode,
  isParent = false
}: {
  category: Category
  viewMode: "grid" | "list"
  isParent?: boolean
}) {
  const router = useRouter()

  const handleCategoryClick = () => {
    router.push(`/products?category=${category.id}`)
  }

  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isParent && "border-2 border-blue-200 bg-blue-50"
        )}
        onClick={handleCategoryClick}
      >
        <div className="flex items-center p-4">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white">
            <span className="text-2xl">{category.icon || "📦"}</span>
          </div>

          <div className="flex-1">
            <h3 className={cn(
              "font-medium",
              isParent ? "text-lg text-blue-800" : "text-base"
            )}>
              {category.name}
            </h3>
            {category.description && (
              <p className="text-sm text-gray-600">{category.description}</p>
            )}
          </div>

          <div className="text-right">
            <Badge variant={isParent ? "default" : "secondary"}>
              {category.productCount} products
            </Badge>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-lg",
        isParent && "border-2 border-blue-200 bg-blue-50"
      )}
      onClick={handleCategoryClick}
    >
      <CardContent className="p-6 text-center">
        <div className={cn(
          "mx-auto mb-4 flex items-center justify-center rounded-full bg-white",
          isParent ? "h-16 w-16" : "h-12 w-12"
        )}>
          <span className={isParent ? "text-3xl" : "text-2xl"}>
            {category.icon || "📦"}
          </span>
        </div>

        <h3 className={cn(
          "mb-2 font-medium group-hover:text-blue-600",
          isParent ? "text-lg text-blue-800" : "text-base"
        )}>
          {category.name}
        </h3>

        {category.description && (
          <p className="mb-3 text-sm text-gray-600 line-clamp-2">
            {category.description}
          </p>
        )}

        <Badge variant={isParent ? "default" : "secondary"}>
          {category.productCount} products
        </Badge>
      </CardContent>
    </Card>
  )
}

function CategorySkeleton() {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <Skeleton className="mx-auto mb-4 h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto mb-2 h-4 w-24" />
        <Skeleton className="mx-auto mb-3 h-3 w-32" />
        <Skeleton className="mx-auto h-6 w-20" />
      </CardContent>
    </Card>
  )
}
