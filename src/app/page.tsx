"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { ProductCard } from "@/components/product-card"
import { ProductSkeleton } from "@/components/product-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { mockProducts, categories } from "@/lib/mock-data"

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [featuredProducts, setFeaturedProducts] = useState(mockProducts.filter((p) => p.featured))
  const [featuredCategories, setFeaturedCategories] = useState(categories.filter((c) => c.featured))

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="flipkart-gradient text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to Ecommerce</h1>
            <p className="text-xl mb-8 opacity-90">Discover amazing products at unbeatable prices</p>
            <Link href="/categories">
              <Button size="lg" variant="secondary">
                Shop Now
              </Button>
            </Link>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Featured Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredCategories.map((category) => (
                <Link key={category.id} href={`/category/${category.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      {category.image ? (
                        <div className="w-16 h-16 mx-auto mb-2 rounded-lg overflow-hidden">
                          <Image
                            src={category.image || "/placeholder.svg"}
                            alt={category.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="text-3xl mb-2">{category.icon}</div>
                      )}
                      <h3 className="font-medium text-sm">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Show all categories link */}
            <div className="text-center mt-6">
              <Link href="/categories">
                <Button variant="outline">View All Categories</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Featured Products</h2>
              <Link href="/products">
                <Button variant="outline">View All</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
                : featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚚</span>
                </div>
                <h3 className="font-semibold mb-2">Free Delivery</h3>
                <p className="text-muted-foreground">Free delivery on orders above ₹499</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="font-semibold mb-2">Secure Payment</h3>
                <p className="text-muted-foreground">100% secure payment methods</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">↩️</span>
                </div>
                <h3 className="font-semibold mb-2">Easy Returns</h3>
                <p className="text-muted-foreground">7-day return policy</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
