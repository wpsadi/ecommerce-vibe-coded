# tRPC E-commerce API Usage Examples

This document provides comprehensive examples of how to use the tRPC routers in your Next.js frontend components.

## Setup

Make sure you have the tRPC client properly configured in your Next.js app. The routers are automatically typed and provide end-to-end type safety.

```typescript
import { api } from "@/trpc/react"
```

## Products Router

### Get All Products
```typescript
function ProductsList() {
  const { data: products, isLoading, error } = api.products.getAll.useQuery({
    categoryId: "electronics", // Optional
    featured: true, // Optional
    search: "iPhone", // Optional
    sortBy: "price", // Optional: "name" | "price" | "created_at" | "rating"
    sortOrder: "desc", // Optional: "asc" | "desc"
    limit: 20, // Optional
    offset: 0, // Optional
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products?.map((product) => (
        <div key={product.id} className="border p-4 rounded">
          <h3>{product.name}</h3>
          <p>${Number(product.price).toFixed(2)}</p>
          <p>Rating: {product.averageRating}/5 ({product.reviewCount} reviews)</p>
        </div>
      ))}
    </div>
  )
}
```

### Get Product by Slug
```typescript
function ProductDetail({ slug }: { slug: string }) {
  const { data: product, isLoading } = api.products.getBySlug.useQuery({ slug })
  const { data: images } = api.products.getImages.useQuery(
    { productId: product?.id ?? "" },
    { enabled: !!product?.id }
  )
  const { data: reviews } = api.products.getReviews.useQuery(
    { productId: product?.id ?? "", limit: 10 },
    { enabled: !!product?.id }
  )

  if (isLoading) return <div>Loading...</div>
  if (!product) return <div>Product not found</div>

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>${Number(product.price).toFixed(2)}</p>
      
      {/* Product Images */}
      <div className="flex gap-2">
        {images?.map((image) => (
          <img
            key={image.id}
            src={image.url}
            alt={image.altText || product.name}
            className="w-20 h-20 object-cover"
          />
        ))}
      </div>

      {/* Reviews */}
      <div className="mt-8">
        <h3>Reviews</h3>
        {reviews?.map((review) => (
          <div key={review.id} className="border-b py-2">
            <div className="flex items-center gap-2">
              <span>{review.user.name}</span>
              <span>{"★".repeat(review.rating)}</span>
            </div>
            <p>{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Admin: Create Product
```typescript
function CreateProduct() {
  const createProduct = api.products.create.useMutation({
    onSuccess: () => {
      alert("Product created successfully!")
      // Invalidate and refetch products
      utils.products.getAll.invalidate()
    },
  })

  const handleSubmit = (data: FormData) => {
    createProduct.mutate({
      name: data.get("name") as string,
      slug: data.get("slug") as string,
      description: data.get("description") as string,
      price: data.get("price") as string,
      categoryId: data.get("categoryId") as string,
      stock: Number(data.get("stock")),
      featured: data.get("featured") === "on",
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Product Name" required />
      <input name="slug" placeholder="product-slug" required />
      <textarea name="description" placeholder="Description" required />
      <input name="price" type="number" step="0.01" placeholder="Price" required />
      <input name="categoryId" placeholder="Category ID" required />
      <input name="stock" type="number" placeholder="Stock" />
      <label>
        <input name="featured" type="checkbox" />
        Featured Product
      </label>
      <button type="submit" disabled={createProduct.isLoading}>
        Create Product
      </button>
    </form>
  )
}
```

## Categories Router

### Get All Categories
```typescript
function CategoriesNav() {
  const { data: categories } = api.categories.getAll.useQuery()

  return (
    <nav>
      {categories?.map((category) => (
        <Link key={category.id} href={`/category/${category.slug}`}>
          <span>{category.icon}</span>
          {category.name}
          <span>({category.productCount})</span>
        </Link>
      ))}
    </nav>
  )
}
```

### Get Featured Categories
```typescript
function FeaturedCategories() {
  const { data: categories } = api.categories.getFeatured.useQuery()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories?.map((category) => (
        <div key={category.id} className="text-center">
          <div className="text-4xl mb-2">{category.icon}</div>
          <h3>{category.name}</h3>
          <p>{category.productCount} products</p>
        </div>
      ))}
    </div>
  )
}
```

## Cart Router

### Cart Management
```typescript
function CartPage() {
  const { data: cartItems, refetch } = api.cart.getItems.useQuery()
  const { data: cartSummary } = api.cart.getSummary.useQuery()
  
  const updateQuantity = api.cart.updateQuantity.useMutation({
    onSuccess: () => refetch(),
  })
  
  const removeItem = api.cart.removeItem.useMutation({
    onSuccess: () => refetch(),
  })

  const clearCart = api.cart.clearCart.useMutation({
    onSuccess: () => refetch(),
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Your Cart</h1>
        <button onClick={() => clearCart.mutate()}>
          Clear Cart
        </button>
      </div>

      {cartItems?.map((item) => (
        <div key={item.id} className="flex items-center gap-4 border-b py-4">
          <img 
            src={item.primaryImage?.url} 
            alt={item.product.name}
            className="w-16 h-16 object-cover"
          />
          <div className="flex-1">
            <h3>{item.product.name}</h3>
            <p>${Number(item.product.price).toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => updateQuantity.mutate({
                itemId: item.id,
                quantity: Math.max(1, item.quantity - 1)
              })}
            >
              -
            </button>
            <span>{item.quantity}</span>
            <button 
              onClick={() => updateQuantity.mutate({
                itemId: item.id,
                quantity: item.quantity + 1
              })}
            >
              +
            </button>
          </div>
          <button 
            onClick={() => removeItem.mutate({ itemId: item.id })}
            className="text-red-500"
          >
            Remove
          </button>
        </div>
      ))}

      {cartSummary && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <div className="flex justify-between">
            <span>Items: {cartSummary.totalItems}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal: ${cartSummary.subtotal}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Savings: ${cartSummary.savings}</span>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Add to Cart
```typescript
function AddToCartButton({ productId }: { productId: string }) {
  const utils = api.useUtils()
  const addToCart = api.cart.addItem.useMutation({
    onSuccess: () => {
      // Refetch cart data
      utils.cart.getItems.invalidate()
      utils.cart.getSummary.invalidate()
      alert("Added to cart!")
    },
    onError: (error) => {
      alert(error.message)
    },
  })

  return (
    <button 
      onClick={() => addToCart.mutate({ productId, quantity: 1 })}
      disabled={addToCart.isLoading}
    >
      {addToCart.isLoading ? "Adding..." : "Add to Cart"}
    </button>
  )
}
```

## Wishlist Router

### Wishlist Management
```typescript
function WishlistPage() {
  const { data: wishlistItems, refetch } = api.wishlist.getItems.useQuery()
  const { data: wishlistCount } = api.wishlist.getCount.useQuery()
  
  const removeFromWishlist = api.wishlist.removeItem.useMutation({
    onSuccess: () => refetch(),
  })

  return (
    <div>
      <h1>Your Wishlist ({wishlistCount?.count} items)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {wishlistItems?.map((item) => (
          <div key={item.id} className="border p-4 rounded">
            <img 
              src={item.primaryImage?.url} 
              alt={item.product.name}
              className="w-full h-48 object-cover mb-2"
            />
            <h3>{item.product.name}</h3>
            <p>${Number(item.product.price).toFixed(2)}</p>
            <div className="flex gap-2 mt-2">
              <AddToCartButton productId={item.product.id} />
              <button 
                onClick={() => removeFromWishlist.mutate({ itemId: item.id })}
                className="text-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Wishlist Toggle
```typescript
function WishlistToggle({ productId }: { productId: string }) {
  const { data: wishlistStatus } = api.wishlist.isInWishlist.useQuery({ productId })
  const utils = api.useUtils()
  
  const addToWishlist = api.wishlist.addItem.useMutation({
    onSuccess: () => {
      utils.wishlist.isInWishlist.invalidate({ productId })
      utils.wishlist.getCount.invalidate()
    },
  })
  
  const removeFromWishlist = api.wishlist.removeByProductId.useMutation({
    onSuccess: () => {
      utils.wishlist.isInWishlist.invalidate({ productId })
      utils.wishlist.getCount.invalidate()
    },
  })

  const isInWishlist = wishlistStatus?.isInWishlist

  return (
    <button
      onClick={() => {
        if (isInWishlist) {
          removeFromWishlist.mutate({ productId })
        } else {
          addToWishlist.mutate({ productId })
        }
      }}
      className={isInWishlist ? "text-red-500" : "text-gray-500"}
    >
      {isInWishlist ? "❤️" : "🤍"}
    </button>
  )
}
```

## Orders Router

### Create Order (Checkout)
```typescript
function CheckoutPage() {
  const { data: cartItems } = api.cart.getItems.useQuery()
  const utils = api.useUtils()
  
  const createOrder = api.orders.create.useMutation({
    onSuccess: (order) => {
      // Clear cart and redirect to order confirmation
      utils.cart.clearCart.invalidate()
      router.push(`/orders/${order.id}`)
    },
  })

  const handleCheckout = (formData: FormData) => {
    if (!cartItems?.length) return

    const items = cartItems.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.product.price,
    }))

    const shippingAddress = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      addressLine1: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      postalCode: formData.get("postalCode") as string,
      country: "India",
    }

    createOrder.mutate({
      items,
      paymentMethod: formData.get("paymentMethod") as "cod" | "card" | "upi",
      shippingAddress,
      customerNotes: formData.get("notes") as string,
    })
  }

  return (
    <form onSubmit={handleCheckout}>
      <h2>Shipping Address</h2>
      <input name="firstName" placeholder="First Name" required />
      <input name="lastName" placeholder="Last Name" required />
      <input name="address" placeholder="Address" required />
      <input name="city" placeholder="City" required />
      <input name="state" placeholder="State" required />
      <input name="postalCode" placeholder="Postal Code" required />
      
      <h2>Payment Method</h2>
      <select name="paymentMethod" required>
        <option value="cod">Cash on Delivery</option>
        <option value="card">Credit/Debit Card</option>
        <option value="upi">UPI</option>
      </select>
      
      <textarea name="notes" placeholder="Order Notes (Optional)" />
      
      <button type="submit" disabled={createOrder.isLoading}>
        {createOrder.isLoading ? "Placing Order..." : "Place Order"}
      </button>
    </form>
  )
}
```

### Order History
```typescript
function OrderHistory() {
  const { data: orders } = api.orders.getMyOrders.useQuery({
    limit: 10,
    offset: 0,
  })

  return (
    <div>
      <h1>Order History</h1>
      {orders?.map((order) => (
        <div key={order.id} className="border p-4 rounded mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h3>Order #{order.orderNumber}</h3>
              <p>Status: {order.status}</p>
              <p>Total: ${Number(order.totalAmount).toFixed(2)}</p>
            </div>
            <div>
              <Link href={`/orders/${order.id}`}>
                View Details
              </Link>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}
```

## Users Router

### User Profile
```typescript
function UserProfile() {
  const { data: profile } = api.users.getProfile.useQuery()
  const { data: addresses } = api.users.getAddresses.useQuery({})
  
  const updateProfile = api.users.updateProfile.useMutation({
    onSuccess: () => {
      alert("Profile updated successfully!")
    },
  })

  const handleProfileUpdate = (formData: FormData) => {
    updateProfile.mutate({
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
    })
  }

  return (
    <div>
      <h1>My Profile</h1>
      
      <form onSubmit={handleProfileUpdate}>
        <input 
          name="name" 
          defaultValue={profile?.name} 
          placeholder="Full Name" 
          required 
        />
        <input 
          name="phone" 
          defaultValue={profile?.phone || ""} 
          placeholder="Phone Number" 
        />
        <button type="submit" disabled={updateProfile.isLoading}>
          Update Profile
        </button>
      </form>

      <h2>Addresses</h2>
      {addresses?.map((address) => (
        <div key={address.id} className="border p-4 rounded mb-2">
          <div className="flex justify-between">
            <div>
              <p>{address.firstName} {address.lastName}</p>
              <p>{address.addressLine1}</p>
              <p>{address.city}, {address.state} {address.postalCode}</p>
            </div>
            <div>
              {address.isDefault && <span className="badge">Default</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

## Error Handling

```typescript
function ProductsWithErrorHandling() {
  const { data, error, isLoading, refetch } = api.products.getAll.useQuery(
    { limit: 10 },
    {
      retry: 3,
      retryDelay: 1000,
    }
  )

  if (isLoading) return <div>Loading products...</div>
  
  if (error) {
    return (
      <div className="text-red-500">
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Try Again</button>
      </div>
    )
  }

  return (
    <div>
      {data?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

## Optimistic Updates

```typescript
function OptimisticCartUpdate() {
  const utils = api.useUtils()
  
  const updateQuantity = api.cart.updateQuantity.useMutation({
    onMutate: async ({ itemId, quantity }) => {
      // Cancel outgoing refetches
      await utils.cart.getItems.cancel()
      
      // Snapshot previous value
      const previousItems = utils.cart.getItems.getData()
      
      // Optimistically update
      utils.cart.getItems.setData(undefined, (old) => 
        old?.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        )
      )
      
      return { previousItems }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      utils.cart.getItems.setData(undefined, context?.previousItems)
    },
    onSettled: () => {
      // Always refetch after error or success
      utils.cart.getItems.invalidate()
    },
  })

  // Component implementation...
}
```

This comprehensive tRPC setup provides:

1. **Type Safety**: Full end-to-end type safety from database to frontend
2. **Authentication**: Proper user authentication and role-based access control
3. **Error Handling**: Comprehensive error handling with proper HTTP status codes
4. **Validation**: Input validation using Zod schemas
5. **Performance**: Optimistic updates and efficient caching
6. **Admin Features**: Admin-only endpoints for managing products, categories, and users
7. **Real-world Features**: Cart management, wishlist, order processing, and user profiles

The routers cover all essential e-commerce functionality and can be easily extended for additional features.
