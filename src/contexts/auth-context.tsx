"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: "user" | "admin"
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string, phone?: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)

    // Mock authentication - in real app, this would be an API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock users
    const mockUsers = [
      { id: "1", name: "John Doe", email: "user@example.com", password: "password", role: "user" as const },
      { id: "2", name: "Admin User", email: "admin@example.com", password: "admin", role: "admin" as const },
    ]

    const foundUser = mockUsers.find((u) => u.email === email && u.password === password)

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem("user", JSON.stringify(userWithoutPassword))
      setLoading(false)
      toast.success("Welcome back!")
      return true
    }

    setLoading(false)
    toast.error("Invalid email or password")
    return false
  }

  const signup = async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
    setLoading(true)

    // Mock signup - in real app, this would be an API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      role: "user" as const,
    }

    setUser(newUser)
    localStorage.setItem("user", JSON.stringify(newUser))
    setLoading(false)
    toast.success("Your account has been created successfully!")
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
