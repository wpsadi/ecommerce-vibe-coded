"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useCartItems, useUpdateCartItem, useRemoveFromCart, useClearCart } from "@/hooks/use-trpc-hooks"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function CartPage() {
    const router = useRouter()
    const [couponCode, setCouponCode] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)

    // tRPC Hooks
    const { data: cartItems, isLoading } = useCartItems()
    const updateCartItem = useUpdateCartItem()
    const removeFromCart = useRemoveFromCart()
    const clearCart = useClearCart()

    const handleQuantityChange = async (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(itemId)
            return
        }

        try {
            await updateCartItem.mutateAsync({
                itemId,
                quantity: newQuantity,
            })
        } catch (error) {
            toast.error("Failed to update quantity")
        }
    }

    const handleRemoveItem = async (itemId: string) => {
        try {
            await removeFromCart.mutateAsync({ itemId })
            toast.success("Item removed from cart")
        } catch (error) {
            toast.error("Failed to remove item")
        }
    }

    const handleClearCart = async () => {
        try {
            await clearCart.mutateAsync()
            toast.success("Cart cleared")
        } catch (error) {
            toast.error("Failed to clear cart")
        }
    }

    const applyCoupon = () => {
        if (!couponCode.trim()) {
            toast.error("Please enter a coupon code")
            return
        }

        // Mock coupon validation
        const validCoupons = ["SAVE10", "WELCOME20", "FREESHIP"]
        if (validCoupons.includes(couponCode.toUpperCase())) {
            setAppliedCoupon(couponCode.toUpperCase())
            toast.success(`Coupon ${couponCode.toUpperCase()} applied!`)
            setCouponCode("")
        } else {
            toast.error("Invalid coupon code")
        }
    }

    const removeCoupon = () => {
        setAppliedCoupon(null)
        toast.success("Coupon removed")
    }

    // Calculate totals
    const subtotal = cartItems?.reduce((total, item) =>
        total + (Number(item.product.price) * item.quantity), 0
    ) || 0

    const savings = cartItems?.reduce((total, item) => {
        if (item.product.originalPrice) {
            const savedPerItem = Number(item.product.originalPrice) - Number(item.product.price)
            return total + (savedPerItem * item.quantity)
        }
        return total
    }, 0) || 0

    const couponDiscount = appliedCoupon
        ? appliedCoupon === "SAVE10"
            ? subtotal * 0.1
            : appliedCoupon === "WELCOME20"
                ? subtotal * 0.2
                : 0
        : 0

    const shipping = appliedCoupon === "FREESHIP" ? 0 : subtotal > 500 ? 0 : 50
    const tax = (subtotal - couponDiscount) * 0.18 // 18% GST
    const total = subtotal - couponDiscount + shipping + tax

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-32 bg-gray-200 rounded"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-32 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                            <div className="h-64 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center justify-center py-16">
                        <ShoppingBag className="h-24 w-24 text-gray-300 mb-6" />
                        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                        <p className="text-gray-600 mb-8 text-center max-w-md">
                            Looks like you haven't added any items to your cart yet.
                            Start shopping to fill it up!
                        </p>
                        <div className="flex gap-4">
                            <Button onClick={() => router.push("/products")}>
                                Continue Shopping
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
                            <h1 className="text-3xl font-bold">Shopping Cart</h1>
                            <p className="text-gray-600">
                                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                    </div>

                    {cartItems.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleClearCart}
                            disabled={clearCart.isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear Cart
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                onQuantityChange={handleQuantityChange}
                                onRemove={handleRemoveItem}
                                isUpdating={updateCartItem.isLoading}
                                isRemoving={removeFromCart.isLoading}
                            />
                        ))}

                        {/* Continue Shopping */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium mb-1">Continue Shopping</h3>
                                        <p className="text-sm text-gray-600">
                                            Discover more products you might like
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push("/products")}
                                    >
                                        Shop More
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-6">
                        {/* Coupon Code */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gift className="h-5 w-5" />
                                    Coupon Code
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!appliedCoupon ? (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter coupon code"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                                        />
                                        <Button onClick={applyCoupon}>Apply</Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{appliedCoupon}</Badge>
                                            <span className="text-sm text-green-700">
                                                Coupon applied!
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={removeCoupon}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Order Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>

                                    {savings > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Savings</span>
                                            <span>-₹{savings.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {couponDiscount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Coupon Discount</span>
                                            <span>-₹{couponDiscount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span className={cn(
                                            shipping === 0 && "text-green-600"
                                        )}>
                                            {shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Tax (GST 18%)</span>
                                        <span>₹{tax.toFixed(2)}</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>

                                {subtotal < 500 && (
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            Add ₹{(500 - subtotal).toFixed(2)} more for free shipping!
                                        </p>
                                    </div>
                                )}

                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={() => router.push("/checkout")}
                                >
                                    Proceed to Checkout
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Recommended Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle>You might also like</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">
                                    Personalized recommendations coming soon!
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CartItem({
    item,
    onQuantityChange,
    onRemove,
    isUpdating,
    isRemoving
}: {
    item: any
    onQuantityChange: (itemId: string, quantity: number) => void
    onRemove: (itemId: string) => void
    isUpdating: boolean
    isRemoving: boolean
}) {
    const discountPercentage = item.product.originalPrice
        ? Math.round(((Number(item.product.originalPrice) - Number(item.product.price)) / Number(item.product.originalPrice)) * 100)
        : 0

    const itemTotal = Number(item.product.price) * item.quantity
    const itemSavings = item.product.originalPrice
        ? (Number(item.product.originalPrice) - Number(item.product.price)) * item.quantity
        : 0

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                            src={item.product.primaryImage || "/placeholder-product.jpg"}
                            alt={item.product.name}
                            fill
                            className="object-cover rounded-lg"
                        />
                        {discountPercentage > 0 && (
                            <Badge className="absolute -top-2 -right-2 bg-red-500 text-xs">
                                {discountPercentage}%
                            </Badge>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <Link
                                href={`/product/${item.product.id}`}
                                className="font-medium hover:text-primary transition-colors"
                            >
                                {item.product.name}
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemove(item.id)}
                                disabled={isRemoving}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <span className="font-bold">₹{Number(item.product.price).toFixed(2)}</span>
                            {item.product.originalPrice && (
                                <span className="text-sm text-gray-500 line-through">
                                    ₹{Number(item.product.originalPrice).toFixed(2)}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                                    disabled={isUpdating || item.quantity <= 1}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-12 text-center font-medium">
                                    {item.quantity}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                                    disabled={isUpdating || item.quantity >= item.product.stock}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>

                            <div className="text-right">
                                <div className="font-bold">₹{itemTotal.toFixed(2)}</div>
                                {itemSavings > 0 && (
                                    <div className="text-sm text-green-600">
                                        Save ₹{itemSavings.toFixed(2)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {item.quantity >= item.product.stock && (
                            <p className="text-sm text-red-600 mt-2">
                                Only {item.product.stock} in stock
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
