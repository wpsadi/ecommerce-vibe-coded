"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { User, Mail, Phone, Calendar, ShoppingBag, ShoppingCart } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { mockUsers, mockOrders, type User as UserType, type Order } from "@/lib/mock-data"

export default function AdminUserDetailsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()

  const [userData, setUserData] = useState<UserType | null>(null)
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [userCart, setUserCart] = useState<any[]>([]) // Mock cart data

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/login")
      return
    }

    const userId = params.id as string
    const foundUser = mockUsers.find((u) => u.id === userId)
    const orders = mockOrders.filter((o) => o.userId === userId)

    setUserData(foundUser || null)
    setUserOrders(orders)

    // Mock cart data
    setUserCart([
      {
        id: "1",
        name: "iPhone 15 Pro Max",
        price: 134900,
        quantity: 1,
        image: "/placeholder.svg?height=100&width=100",
      },
    ])
  }, [user, router, params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "confirmed":
        return "bg-blue-500 hover:bg-blue-600"
      case "shipped":
        return "bg-purple-500 hover:bg-purple-600"
      case "delivered":
        return "bg-green-500 hover:bg-green-600"
      case "cancelled":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  if (!user || user.role !== "admin") {
    return null
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <Button onClick={() => router.push("/admin/users")}>Back to Users</Button>
          </div>
        </main>
      </div>
    )
  }

  const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{userData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {userData.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {userData.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(userData.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={userData.blocked ? "destructive" : "default"}>
                    {userData.blocked ? "Blocked" : "Active"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                  <span className="font-bold">{userOrders.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                  <span className="font-bold">₹{totalSpent.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cart Items</span>
                  <span className="font-bold">{userCart.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Orders ({userOrders.length})
                </TabsTrigger>
                <TabsTrigger value="cart" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Current Cart ({userCart.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No orders found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Items</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userOrders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                      {order.items.slice(0, 3).map((item, index) => (
                                        <Image
                                          key={index}
                                          src={item.image || "/placeholder.svg"}
                                          alt={item.name}
                                          width={24}
                                          height={24}
                                          className="rounded border-2 border-background"
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {order.items.length} item{order.items.length > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">₹{order.total.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(order.status)}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cart">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Cart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userCart.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userCart.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              width={60}
                              height={60}
                              className="rounded object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}

                        <div className="border-t pt-4">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>
                              ₹{userCart.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
