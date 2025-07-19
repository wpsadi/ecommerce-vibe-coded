"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Eye, UserX, UserCheck } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { mockUsers, type User } from "@/lib/mock-data"

export default function AdminUsersPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>(mockUsers.filter((u) => u.role === "user"))
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/login")
    }
  }, [user, router])

  useEffect(() => {
    let filtered = mockUsers.filter((u) => u.role === "user")

    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.phone && u.phone.includes(searchQuery)),
      )
    }

    setUsers(filtered)
  }, [searchQuery])

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, blocked: !currentStatus } : u)))

      toast.success(`User has been ${currentStatus ? "blocked" : "unblocked"} successfully`)
    } catch (error) {
      toast.error("Failed to update user status")
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <div className="text-sm text-muted-foreground">Total Users: {users.length}</div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userData) => (
                    <TableRow key={userData.id}>
                      <TableCell className="font-medium">{userData.name}</TableCell>
                      <TableCell>{userData.email}</TableCell>
                      <TableCell>{userData.phone || "N/A"}</TableCell>
                      <TableCell>{new Date(userData.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={userData.blocked ? "destructive" : "default"}>
                          {userData.blocked ? "Blocked" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/users/${userData.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={
                                  userData.blocked
                                    ? "text-green-500 hover:text-green-700"
                                    : "text-red-500 hover:text-red-700"
                                }
                              >
                                {userData.blocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{userData.blocked ? "Unblock User" : "Block User"}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to {userData.blocked ? "unblock" : "block"} {userData.name}?
                                  {!userData.blocked && " This will prevent them from accessing their account."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleToggleUserStatus(userData.id, !userData.blocked)}
                                  className={
                                    userData.blocked ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                                  }
                                >
                                  {userData.blocked ? "Unblock" : "Block"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
