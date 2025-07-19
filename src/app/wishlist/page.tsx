"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingCart, Trash2, ArrowLeft, Grid, List, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWishlist, useRemoveFromWishlist, useClearWishlist, useAddToCart } from "@/hooks/use-trpc-hooks"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type WishlistItem = {
    id: string
    createdAt: string
    product: {
        id: string
        name: string
        price: string | number
        originalPrice?: string | number
        primaryImage?: string
        stock: number
    }
}

export default function WishlistPage() {
    const router = useRouter()
    const [sortBy, setSortBy] = useState<"added_at" | "price" | "name">("added_at")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

    // tRPC Hooks
    const { data: wishlistItems, isLoading } = useWishlist()
    const removeFromWishlist = useRemoveFromWishlist()
    const clearWishlist = useClearWishlist()
    const addToCart = useAddToCart()

    const handleRemoveItem = async (itemId: string) => {
        try {
            await removeFromWishlist.mutateAsync({ itemId })
            toast.success("Item removed from wishlist")
        } catch (error) {
            toast.error("Failed to remove item")
        }
    }

    const handleClearWishlist = async () => {
        try {
            await clearWishlist.mutateAsync()
            toast.success("Wishlist cleared")
        } catch (error) {
            toast.error("Failed to clear wishlist")
        }
    }

    const handleAddToCart = async (productId: string, productName: string) => {
        try {
            await addToCart.mutateAsync({
                productId,
                quantity: 1,
            })
            toast.success(`${productName} added to cart!`)
        } catch (error) {
            toast.error("Failed to add to cart")
        }
    }

    const handleMoveAllToCart = async () => {
        if (!wishlistItems || wishlistItems.length === 0) return

        try {
            const promises = wishlistItems.map(item =>
                addToCart.mutateAsync({
                    productId: item.product.id,
                    quantity: 1,
                })
            )

            await Promise.all(promises)
            toast.success("All items moved to cart!")
        } catch (error) {
            toast.error("Failed to move items to cart")
        }
    }

    const handleSortChange = (value: string) => {
        const [newSortBy, newSortOrder] = value.split("-") as [typeof sortBy, typeof sortOrder]
        setSortBy(newSortBy)
        setSortOrder(newSortOrder)
    }

    // Sort items
    const sortedItems = wishlistItems ? [...wishlistItems].sort((a, b) => {
        const itemA = a as WishlistItem
        const itemB = b as WishlistItem
        let aValue: string | number | Date
        let bValue: string | number | Date

        switch (sortBy) {
            case "name":
                aValue = itemA.product.name.toLowerCase()
                bValue = itemB.product.name.toLowerCase()
                break
            case "price":
                aValue = Number(itemA.product.price)
                bValue = Number(itemB.product.price)
                break
            case "added_at":
            default:
                aValue = new Date(itemA.createdAt)
                bValue = new Date(itemB.createdAt)
                break
        }

        if (sortOrder === "asc") {
            return aValue > bValue ? 1 : -1
        }
        return aValue < bValue ? 1 : -1
    }) : []

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="bg-gray-200 h-8 w-32 rounded" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-gray-200 h-64 rounded" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!wishlistItems || wishlistItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center justify-center py-16">
                        <Heart className="h-24 w-24 text-gray-300 mb-6" />
                        <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
                        <p className="text-gray-600 mb-8 text-center max-w-md">
                            Save items you love for later. Start browsing and add products to your wishlist!
                        </p>
                        <div className="flex gap-4">
                            <Button onClick={() => router.push("/products")}>
                                Start Shopping
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/categories")}
                            >
                                Browse Categories
                            </Button>
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
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">My Wishlist</h1>
                            <p className="text-gray-600">
                                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {wishlistItems.length > 0 && (
                            <>
                                <Button
                                    onClick={handleMoveAllToCart}
                                    disabled={addToCart.isLoading}
                                >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Move All to Cart
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleClearWishlist}
                                    disabled={clearWishlist.isLoading}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear Wishlist
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Filter className="h-5 w-5" />
                        <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="added_at-desc">Recently Added</SelectItem>
                                <SelectItem value="added_at-asc">Oldest First</SelectItem>
                                <SelectItem value="name-asc">Name A-Z</SelectItem>
                                <SelectItem value="name-desc">Name Z-A</SelectItem>
                                <SelectItem value="price-asc">Price Low to High</SelectItem>
                                <SelectItem value="price-desc">Price High to Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

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

                {/* Wishlist Items */}
                <div className={cn(
                    viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "space-y-4"
                )}>
                    {sortedItems.map((item) => (
                        <WishlistItem
                            key={item.id}
                            item={item}
                            viewMode={viewMode}
                            onRemove={handleRemoveItem}
                            onAddToCart={handleAddToCart}
                            isRemoving={removeFromWishlist.isLoading}
                            isAddingToCart={addToCart.isLoading}
                        />
                    ))}
                </div>

                {/* Recommendations */}
                <div className="mt-16">
                    <h2 className="text-2xl font-bold mb-6">You might also like</h2>
                    <div className="text-center py-8 bg-white rounded-lg border">
                        <p className="text-gray-600">
                            Personalized recommendations based on your wishlist coming soon!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function WishlistItem({
    item,
    viewMode,
    onRemove,
    onAddToCart,
    isRemoving,
    isAddingToCart
}: {
    item: any
    viewMode: "grid" | "list"
    onRemove: (itemId: string) => void
    onAddToCart: (productId: string, productName: string) => void
    isRemoving: boolean
    isAddingToCart: boolean
}) {
    const discountPercentage = item.product.originalPrice
        ? Math.round(((Number(item.product.originalPrice) - Number(item.product.price)) / Number(item.product.originalPrice)) * 100)
        : 0

    const isOutOfStock = item.product.stock === 0

    if (viewMode === "list") {
        return (
            <Card className="overflow-hidden">
                <div className="flex">
                    <div className="relative w-48 h-48 flex-shrink-0">
                        <Link href={`/product/${item.product.id}`}>
                            <Image
                                src={item.product.primaryImage || "/placeholder-product.jpg"}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                            />
                        </Link>
                        {discountPercentage > 0 && (
                            <Badge className="absolute left-2 top-2 bg-red-500">
                                -{discountPercentage}%
                            </Badge>
                        )}
                        {isOutOfStock && (
                            <Badge variant="secondary" className="absolute right-2 top-2">
                                Out of Stock
                            </Badge>
                        )}
                    </div>

                    <div className="flex-1 p-6">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <Link href={`/product/${item.product.id}`}>
                                    <h3 className="font-semibold text-lg hover:text-primary transition-colors mb-2">
                                        {item.product.name}
                                    </h3>
                                </Link>

                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl font-bold">
                                        ₹{Number(item.product.price).toLocaleString()}
                                    </span>
                                    {item.product.originalPrice && (
                                        <span className="text-lg text-gray-500 line-through">
                                            ₹{Number(item.product.originalPrice).toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-gray-600 mb-4">
                                    Added on {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onRemove(item.id)}
                                    disabled={isRemoving}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                <Button
                                    onClick={() => onAddToCart(item.product.id, item.product.name)}
                                    disabled={isOutOfStock || isAddingToCart}
                                    className="min-w-32"
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    {isAddingToCart ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="group overflow-hidden">
            <div className="relative aspect-square overflow-hidden">
                <Link href={`/product/${item.product.id}`}>
                    <Image
                        src={item.product.primaryImage || "/placeholder-product.jpg"}
                        alt={item.product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                    />
                </Link>

                {discountPercentage > 0 && (
                    <Badge className="absolute left-2 top-2 bg-red-500">
                        -{discountPercentage}%
                    </Badge>
                )}

                {isOutOfStock && (
                    <Badge variant="secondary" className="absolute right-2 top-2">
                        Out of Stock
                    </Badge>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 bottom-2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove(item.id)}
                    disabled={isRemoving}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <CardContent className="p-4">
                <Link href={`/product/${item.product.id}`}>
                    <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors mb-2">
                        {item.product.name}
                    </h3>
                </Link>

                <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold">₹{Number(item.product.price).toLocaleString()}</span>
                    {item.product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                            ₹{Number(item.product.originalPrice).toLocaleString()}
                        </span>
                    )}
                </div>

                <p className="text-xs text-gray-600 mb-3">
                    Added {new Date(item.createdAt).toLocaleDateString()}
                </p>

                <Button
                    className="w-full"
                    onClick={() => onAddToCart(item.product.id, item.product.name)}
                    disabled={isOutOfStock || isAddingToCart}
                >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {isAddingToCart ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
            </CardContent>
        </Card>
    )
}
