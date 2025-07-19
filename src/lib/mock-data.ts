export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  images?: string[] // Add images array
  category: string
  categoryId: string // Add categoryId for better relationship
  rating: number
  reviews: number
  description: string
  specifications: Record<string, string>
  stock: number
  discount?: number
  featured?: boolean
}

export interface Order {
  id: string
  userId: string
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
    image: string
  }>
  total: number
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  paymentStatus: "pending" | "paid" | "failed"
  paymentMethod: "cod" | "card" | "upi"
  address: {
    name: string
    phone: string
    street: string
    city: string
    state: string
    pincode: string
  }
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: "user" | "admin"
  createdAt: string
  blocked?: boolean
}

export interface Category {
  id: string
  name: string
  description: string
  icon: string
  image?: string // Category photo
  featured: boolean // Featured on home page
  productCount: number
  createdAt: string
  updatedAt: string
}

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    price: 134900,
    originalPrice: 159900,
    image: "/placeholder.svg?height=300&width=300&text=iPhone-Main",
    images: [
      "/placeholder.svg?height=300&width=300&text=iPhone-Main",
      "/placeholder.svg?height=300&width=300&text=iPhone-Back",
      "/placeholder.svg?height=300&width=300&text=iPhone-Side",
      "/placeholder.svg?height=300&width=300&text=iPhone-Box",
    ],
    category: "Mobiles",
    categoryId: "mobiles",
    rating: 4.5,
    reviews: 1250,
    description: "The most advanced iPhone ever with titanium design and A17 Pro chip.",
    specifications: {
      Display: "6.7-inch Super Retina XDR",
      Chip: "A17 Pro",
      Camera: "48MP Main + 12MP Ultra Wide + 12MP Telephoto",
      Storage: "256GB",
      Battery: "Up to 29 hours video playback",
    },
    stock: 25,
    discount: 16,
    featured: true,
  },
  {
    id: "2",
    name: "Samsung Galaxy S24 Ultra",
    price: 124999,
    originalPrice: 129999,
    image: "/placeholder.svg?height=300&width=300",
    category: "Mobiles",
    categoryId: "mobiles",
    rating: 4.4,
    reviews: 890,
    description: "Ultimate Galaxy experience with S Pen and AI-powered features.",
    specifications: {
      Display: "6.8-inch Dynamic AMOLED 2X",
      Processor: "Snapdragon 8 Gen 3",
      Camera: "200MP Main + 50MP Periscope + 12MP Ultra Wide + 10MP Telephoto",
      Storage: "256GB",
      Battery: "5000mAh",
    },
    stock: 18,
    discount: 4,
    featured: true,
  },
  {
    id: "3",
    name: "MacBook Air M3",
    price: 114900,
    originalPrice: 134900,
    image: "/placeholder.svg?height=300&width=300",
    category: "Electronics",
    categoryId: "electronics",
    rating: 4.7,
    reviews: 567,
    description: "Supercharged by M3 chip for incredible performance and all-day battery life.",
    specifications: {
      Chip: "Apple M3",
      Display: "13.6-inch Liquid Retina",
      Memory: "8GB unified memory",
      Storage: "256GB SSD",
      Battery: "Up to 18 hours",
    },
    stock: 12,
    discount: 15,
    featured: true,
  },
  {
    id: "4",
    name: "Sony WH-1000XM5",
    price: 29990,
    originalPrice: 34990,
    image: "/placeholder.svg?height=300&width=300",
    category: "Electronics",
    categoryId: "electronics",
    rating: 4.6,
    reviews: 2340,
    description: "Industry-leading noise canceling headphones with premium sound quality.",
    specifications: {
      Driver: "30mm",
      "Frequency Response": "4Hz-40kHz",
      "Battery Life": "Up to 30 hours",
      Connectivity: "Bluetooth 5.2, NFC",
      Weight: "250g",
    },
    stock: 45,
    discount: 14,
  },
  {
    id: "5",
    name: "Nike Air Force 1",
    price: 7495,
    originalPrice: 8995,
    image: "/placeholder.svg?height=300&width=300",
    category: "Fashion",
    categoryId: "fashion",
    rating: 4.3,
    reviews: 1890,
    description: "Classic basketball shoe with timeless style and comfort.",
    specifications: {
      Upper: "Leather",
      Sole: "Rubber",
      Closure: "Lace-up",
      Style: "Low-top",
      Color: "White",
    },
    stock: 67,
    discount: 17,
  },
  {
    id: "6",
    name: "Levi's 511 Slim Jeans",
    price: 2999,
    originalPrice: 3999,
    image: "/placeholder.svg?height=300&width=300",
    category: "Fashion",
    categoryId: "fashion",
    rating: 4.2,
    reviews: 756,
    description: "Slim fit jeans with classic 5-pocket styling.",
    specifications: {
      Fit: "Slim",
      Material: "99% Cotton, 1% Elastane",
      Rise: "Mid-rise",
      "Leg Opening": "14.5 inches",
      Color: "Dark Blue",
    },
    stock: 89,
    discount: 25,
  },
]

export const mockOrders: Order[] = [
  {
    id: "ORD001",
    userId: "1",
    items: [
      {
        productId: "1",
        name: "iPhone 15 Pro Max",
        price: 134900,
        quantity: 1,
        image: "/placeholder.svg?height=100&width=100",
      },
    ],
    total: 134900,
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "card",
    address: {
      name: "John Doe",
      phone: "+91 9876543210",
      street: "123 Main Street, Apartment 4B",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-18T14:20:00Z",
  },
  {
    id: "ORD002",
    userId: "1",
    items: [
      {
        productId: "4",
        name: "Sony WH-1000XM5",
        price: 29990,
        quantity: 1,
        image: "/placeholder.svg?height=100&width=100",
      },
      {
        productId: "5",
        name: "Nike Air Force 1",
        price: 7495,
        quantity: 2,
        image: "/placeholder.svg?height=100&width=100",
      },
    ],
    total: 44980,
    status: "shipped",
    paymentStatus: "paid",
    paymentMethod: "upi",
    address: {
      name: "John Doe",
      phone: "+91 9876543210",
      street: "123 Main Street, Apartment 4B",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    createdAt: "2024-01-20T09:15:00Z",
    updatedAt: "2024-01-22T11:45:00Z",
  },
]

export const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "user@example.com",
    phone: "+91 9876543210",
    role: "user",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+91 9876543211",
    role: "user",
    createdAt: "2024-01-05T00:00:00Z",
  },
]

export const categories: Category[] = [
  {
    id: "mobiles",
    name: "Mobiles",
    description: "Latest smartphones and mobile accessories",
    icon: "📱",
    image: "/placeholder.svg?height=200&width=300&text=Mobiles",
    featured: true,
    productCount: 2,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "electronics",
    name: "Electronics",
    description: "Computers, laptops, and electronic gadgets",
    icon: "💻",
    image: "/placeholder.svg?height=200&width=300&text=Electronics",
    featured: true,
    productCount: 2,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "fashion",
    name: "Fashion",
    description: "Clothing, shoes, and fashion accessories",
    icon: "👕",
    image: "/placeholder.svg?height=200&width=300&text=Fashion",
    featured: true,
    productCount: 2,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "home",
    name: "Home & Kitchen",
    description: "Home appliances and kitchen essentials",
    icon: "🏠",
    image: "/placeholder.svg?height=200&width=300&text=Home",
    featured: false,
    productCount: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "books",
    name: "Books",
    description: "Books, e-books, and educational materials",
    icon: "📚",
    image: "/placeholder.svg?height=200&width=300&text=Books",
    featured: false,
    productCount: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "sports",
    name: "Sports",
    description: "Sports equipment and fitness accessories",
    icon: "⚽",
    image: "/placeholder.svg?height=200&width=300&text=Sports",
    featured: false,
    productCount: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
]
