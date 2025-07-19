"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Users, Package, ShoppingCart, DollarSign, AlertTriangle, Grid3X3 } from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { mockProducts, mockOrders, mockUsers, categories } from "@/lib/mock-data"

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/login")
    }
  }, [user, router])

  if (!user || user.role !== "admin") {
    return null
  }

  const totalUsers = mockUsers.filter((u) => u.role === "user").length
  const totalProducts = mockProducts.length
  const totalOrders = mockOrders.length
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0)
  const totalCategories = categories.length
  const featuredCategories = categories.filter((c) => c.featured).length
  const lowStockProducts = mockProducts.filter((p) => p.stock < 10).length

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      description: "Registered customers",
    },
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      description: "Products in catalog",
    },
    {
      title: "Total Categories",
      value: totalCategories,
      icon: Grid3X3,
      description: `${featuredCategories} featured`,
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      description: "Orders placed",
    },
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "Revenue generated",
    },
  ]

  const quickActions = [
    {
      title: "Manage Categories",
      description: "Add, edit, or manage product categories",
      href: "/admin/categories",
      icon: Grid3X3,
    },
    {
      title: "Manage Products",
      description: "Add, edit, or remove products",
      href: "/admin/products",
      icon: Package,
    },
    {
      title: "Manage Orders",
      description: "View and update order status",
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      href: "/admin/users",
      icon: Users,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="text-sm text-muted-foreground">Welcome back, {user.name}</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts */}
        {lowStockProducts > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                {lowStockProducts} products have low stock (less than 10 items)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/products?filter=low-stock">
                <Button
                  variant="outline"
                  className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900 bg-transparent"
                >
                  View Low Stock Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <action.icon className="h-5 w-5" />
                  {action.title}
                </CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={action.href}>
                  <Button className="w-full">Manage</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
