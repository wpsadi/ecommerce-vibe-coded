"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAddToCart, useAddToWishlist, useRemoveFromWishlistByProductId, useIsInWishlist } from "@/hooks/use-trpc-hooks"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: string | number
    originalPrice?: string | number
    primaryImage?: string
    stock: number
    averageRating?: number
    reviewCount?: number
    slug?: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth()

  // tRPC Hooks
  const addToCart = useAddToCart()
  const addToWishlist = useAddToWishlist()
  const removeFromWishlist = useRemoveFromWishlistByProductId()
  const { data: isInWishlist } = useIsInWishlist(product.id)

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart")
      return
    }

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: 1,
      })
      toast.success(`${product.name} has been added to your cart`)
    } catch (error) {
      toast.error("Failed to add item to cart")
    }
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error("Please login to add items to wishlist")
      return
    }

    try {
      if (isInWishlist?.isInWishlist) {
        await removeFromWishlist.mutateAsync({ productId: product.id })
        toast.success(`${product.name} has been removed from your wishlist`)
      } else {
        await addToWishlist.mutateAsync({ productId: product.id })
        toast.success(`${product.name} has been added to your wishlist`)
      }
    } catch (error) {
      toast.error("Failed to update wishlist")
    }
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative">
          <Link href={`/product/${product.id}`}>
            <div className="aspect-square overflow-hidden">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                width={300}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>

          {discountPercentage > 0 && (
            <Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-600">{discountPercentage}% OFF</Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
            onClick={handleWishlistToggle}
          >
            <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>

        <div className="p-4">
          <Link href={`/product/${product.id}`}>
            <h3 className="font-semibold text-sm mb-2 line-clamp-2 hover:text-primary">{product.name}</h3>
          </Link>

          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs ml-1">{product.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">({product.reviews.toLocaleString()})</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-lg">₹{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <Button onClick={handleAddToCart} className="w-full" size="sm" disabled={product.stock === 0}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
