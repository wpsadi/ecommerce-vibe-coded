"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";

// =============================================================================
// PRODUCTS HOOKS
// =============================================================================

export const useProducts = (filters?: {
	categoryId?: string;
	featured?: boolean;
	search?: string;
	sortBy?: "name" | "price" | "created_at" | "rating";
	sortOrder?: "asc" | "desc";
	limit?: number;
	offset?: number;
}) => {
	return api.products.getAll.useQuery(filters, {
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

export const useProduct = (id: string) => {
	return api.products.getById.useQuery(
		{ id },
		{
			enabled: !!id,
			staleTime: 10 * 60 * 1000, // 10 minutes
		},
	);
};

export const useProductBySlug = (slug: string) => {
	return api.products.getBySlug.useQuery(
		{ slug },
		{
			enabled: !!slug,
			staleTime: 10 * 60 * 1000,
		},
	);
};

export const useProductImages = (productId: string) => {
	return api.products.getImages.useQuery(
		{ productId },
		{
			enabled: !!productId,
			staleTime: 15 * 60 * 1000,
		},
	);
};

export const useProductReviews = (
	productId: string,
	options?: {
		approved?: boolean;
		limit?: number;
		offset?: number;
	},
) => {
	return api.products.getReviews.useQuery(
		{ productId, ...options },
		{
			enabled: !!productId,
			staleTime: 5 * 60 * 1000,
		},
	);
};

export const useFeaturedProducts = () => {
	return api.products.getAll.useQuery(
		{ featured: true, limit: 8 },
		{ staleTime: 10 * 60 * 1000 },
	);
};

export const useRelatedProducts = (
	categoryId: string,
	currentProductId: string,
) => {
	return api.products.getAll.useQuery(
		{ categoryId, limit: 4 },
		{
			enabled: !!categoryId,
			select: (data) =>
				data?.filter((product) => product.id !== currentProductId) || [],
			staleTime: 10 * 60 * 1000,
		},
	);
};

// Admin Product Hooks
export const useCreateProduct = () => {
	const utils = api.useUtils();
	return api.products.create.useMutation({
		onSuccess: () => {
			utils.products.getAll.invalidate();
			toast.success("Product created successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create product");
		},
	});
};

export const useUpdateProduct = () => {
	const utils = api.useUtils();
	return api.products.update.useMutation({
		onSuccess: (data) => {
			utils.products.getById.invalidate({ id: data.id });
			utils.products.getBySlug.invalidate({ slug: data.slug });
			utils.products.getAll.invalidate();
			toast.success("Product updated successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update product");
		},
	});
};

export const useDeleteProduct = () => {
	const utils = api.useUtils();
	return api.products.delete.useMutation({
		onSuccess: () => {
			utils.products.getAll.invalidate();
			toast.success("Product deleted successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete product");
		},
	});
};

export const useUpdateProductStock = () => {
	const utils = api.useUtils();
	return api.products.updateStock.useMutation({
		onSuccess: (data) => {
			utils.products.getById.invalidate({ id: data.id });
			utils.products.getAll.invalidate();
			toast.success("Stock updated successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update stock");
		},
	});
};

export const useLowStockProducts = (threshold?: number) => {
	return api.products.getLowStock.useQuery(
		{ threshold },
		{
			staleTime: 5 * 60 * 1000,
		},
	);
};

export const useAssignProductsToCategory = () => {
	const utils = api.useUtils();
	return api.products.assignToCategory.useMutation({
		onSuccess: (_, { categoryId }) => {
			utils.products.getAll.invalidate({ categoryId });
			utils.categories.getById.invalidate({ id: categoryId });
			toast.success("Products assigned successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to assign products");
		},
	});
};

// =============================================================================
// CATEGORIES HOOKS
// =============================================================================

export const useCategories = () => {
	return api.categories.getAll.useQuery(undefined, {
		staleTime: 15 * 60 * 1000, // Categories don't change often
	});
};

export const useFeaturedCategories = () => {
	return api.categories.getFeatured.useQuery(undefined, {
		staleTime: 15 * 60 * 1000,
	});
};

export const useCategory = (id: string) => {
	return api.categories.getById.useQuery(
		{ id },
		{
			enabled: !!id,
			staleTime: 15 * 60 * 1000,
		},
	);
};

export const useCategoryBySlug = (slug: string) => {
	return api.categories.getBySlug.useQuery(
		{ slug },
		{
			enabled: !!slug,
			staleTime: 15 * 60 * 1000,
		},
	);
};

// Admin Category Hooks
export const useCreateCategory = () => {
	const utils = api.useUtils();
	return api.categories.create.useMutation({
		onSuccess: () => {
			utils.categories.getAll.invalidate();
			utils.categories.getFeatured.invalidate();
			toast.success("Category created successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create category");
		},
	});
};

export const useUpdateCategory = () => {
	const utils = api.useUtils();
	return api.categories.update.useMutation({
		onSuccess: (data) => {
			utils.categories.getById.invalidate({ id: data.id });
			utils.categories.getBySlug.invalidate({ slug: data.slug });
			utils.categories.getAll.invalidate();
			utils.categories.getFeatured.invalidate();
			toast.success("Category updated successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update category");
		},
	});
};

export const useDeleteCategory = () => {
	const utils = api.useUtils();
	return api.categories.delete.useMutation({
		onSuccess: () => {
			utils.categories.getAll.invalidate();
			utils.categories.getFeatured.invalidate();
			toast.success("Category deleted successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete category");
		},
	});
};

export const useToggleCategoryFeatured = () => {
	const utils = api.useUtils();
	return api.categories.toggleFeatured.useMutation({
		onSuccess: () => {
			utils.categories.getAll.invalidate();
			utils.categories.getFeatured.invalidate();
			toast.success("Category updated successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update category");
		},
	});
};

// =============================================================================
// CART HOOKS
// =============================================================================

export const useCart = () => {
	return api.cart.getItems.useQuery(undefined, {
		staleTime: 0, // Cart should always be fresh
		refetchOnWindowFocus: true,
	});
};

export const useCartSummary = () => {
	return api.cart.getSummary.useQuery(undefined, {
		staleTime: 0,
		refetchOnWindowFocus: true,
	});
};

export const useAddToCart = () => {
	const utils = api.useUtils();
	return api.cart.addItem.useMutation({
		onSuccess: () => {
			utils.cart.getItems.invalidate();
			utils.cart.getSummary.invalidate();
			toast.success("Added to cart!");
		},
		onMutate: async (newItem) => {
			// Optimistic update
			await utils.cart.getItems.cancel();
			await utils.cart.getSummary.cancel();

			const previousCart = utils.cart.getItems.getData();
			const previousSummary = utils.cart.getSummary.getData();

			// Update cart items optimistically
			utils.cart.getItems.setData(undefined, (old) => {
				if (!old) return old;
				const existingItem = old.find(
					(item) => item.product.id === newItem.productId,
				);
				if (existingItem) {
					return old.map((item) =>
						item.product.id === newItem.productId
							? { ...item, quantity: item.quantity + newItem.quantity }
							: item,
					);
				}
				// For new items, we'd need more product data, so we'll let the server handle it
				return old;
			});

			return { previousCart, previousSummary };
		},
		onError: (err, newItem, context) => {
			if (context?.previousCart) {
				utils.cart.getItems.setData(undefined, context.previousCart);
			}
			if (context?.previousSummary) {
				utils.cart.getSummary.setData(undefined, context.previousSummary);
			}
			toast.error(err.message || "Failed to add to cart");
		},
	});
};

export const useRemoveFromCart = () => {
	const utils = api.useUtils();
	return api.cart.removeItem.useMutation({
		onSuccess: () => {
			utils.cart.getItems.invalidate();
			utils.cart.getSummary.invalidate();
			toast.success("Item removed from cart");
		},
		onMutate: async (variables) => {
			await utils.cart.getItems.cancel();
			await utils.cart.getSummary.cancel();

			const previousCart = utils.cart.getItems.getData();
			const previousSummary = utils.cart.getSummary.getData();

			utils.cart.getItems.setData(undefined, (old) =>
				old?.filter((item) => item.id !== variables.itemId),
			);

			return { previousCart, previousSummary };
		},
		onError: (err, variables, context) => {
			if (context?.previousCart) {
				utils.cart.getItems.setData(undefined, context.previousCart);
			}
			if (context?.previousSummary) {
				utils.cart.getSummary.setData(undefined, context.previousSummary);
			}
		},
	});
};

export const useUpdateCartItemQuantity = () => {
	const utils = api.useUtils();
	return api.cart.updateQuantity.useMutation({
		onSuccess: () => {
			utils.cart.getItems.invalidate();
			utils.cart.getSummary.invalidate();
		},
		onMutate: async (variables) => {
			await utils.cart.getItems.cancel();
			await utils.cart.getSummary.cancel();

			const previousCart = utils.cart.getItems.getData();
			const previousSummary = utils.cart.getSummary.getData();

			utils.cart.getItems.setData(undefined, (old) =>
				old?.map((item) =>
					item.id === variables.itemId
						? { ...item, quantity: variables.quantity }
						: item,
				),
			);

			return { previousCart, previousSummary };
		},
		onError: (err, variables, context) => {
			if (context?.previousCart) {
				utils.cart.getItems.setData(undefined, context.previousCart);
			}
			if (context?.previousSummary) {
				utils.cart.getSummary.setData(undefined, context.previousSummary);
			}
		},
	});
};

export const useClearCart = () => {
	const utils = api.useUtils();
	return api.cart.clearCart.useMutation({
		onSuccess: () => {
			utils.cart.getItems.invalidate();
			utils.cart.getSummary.invalidate();
			toast.success("Cart cleared!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to clear cart");
		},
	});
};

// =============================================================================
// WISHLIST HOOKS
// =============================================================================

export const useWishlist = () => {
	return api.wishlist.getItems.useQuery(undefined, {
		staleTime: 2 * 60 * 1000, // 2 minutes
	});
};

export const useWishlistCount = () => {
	return api.wishlist.getCount.useQuery(undefined, {
		staleTime: 2 * 60 * 1000,
	});
};

export const useIsInWishlist = (productId: string) => {
	return api.wishlist.isInWishlist.useQuery(
		{ productId },
		{
			enabled: !!productId,
			staleTime: 2 * 60 * 1000,
		},
	);
};

export const useAddToWishlist = () => {
	const utils = api.useUtils();
	return api.wishlist.addItem.useMutation({
		onSuccess: () => {
			utils.wishlist.getItems.invalidate();
			utils.wishlist.getCount.invalidate();
			toast.success("Added to wishlist!");
		},
		onMutate: async (variables) => {
			await utils.wishlist.getCount.cancel();
			await utils.wishlist.isInWishlist.cancel({
				productId: variables.productId,
			});

			const previousCount = utils.wishlist.getCount.getData();
			const previousWishlistStatus = utils.wishlist.isInWishlist.getData({
				productId: variables.productId,
			});

			utils.wishlist.getCount.setData(undefined, (old) =>
				old ? { count: old.count + 1 } : { count: 1 },
			);
			utils.wishlist.isInWishlist.setData(
				{ productId: variables.productId },
				{ isInWishlist: true },
			);

			return { previousCount, previousWishlistStatus };
		},
		onError: (err, variables, context) => {
			if (context?.previousCount) {
				utils.wishlist.getCount.setData(undefined, context.previousCount);
			}
			if (context?.previousWishlistStatus) {
				utils.wishlist.isInWishlist.setData(
					{ productId: variables.productId },
					context.previousWishlistStatus,
				);
			}
		},
	});
};

export const useRemoveFromWishlist = () => {
	const utils = api.useUtils();
	return api.wishlist.removeItem.useMutation({
		onSuccess: () => {
			utils.wishlist.getItems.invalidate();
			utils.wishlist.getCount.invalidate();
			toast.success("Removed from wishlist");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to remove from wishlist");
		},
	});
};

export const useRemoveFromWishlistByProductId = () => {
	const utils = api.useUtils();
	return api.wishlist.removeByProductId.useMutation({
		onSuccess: (data, variables) => {
			utils.wishlist.getItems.invalidate();
			utils.wishlist.getCount.invalidate();
			utils.wishlist.isInWishlist.setData(
				{ productId: variables.productId },
				{ isInWishlist: false },
			);
			toast.success("Removed from wishlist");
		},
		onMutate: async (variables) => {
			await utils.wishlist.getCount.cancel();
			await utils.wishlist.isInWishlist.cancel({
				productId: variables.productId,
			});

			const previousCount = utils.wishlist.getCount.getData();
			const previousWishlistStatus = utils.wishlist.isInWishlist.getData({
				productId: variables.productId,
			});

			utils.wishlist.getCount.setData(undefined, (old) =>
				old ? { count: Math.max(old.count - 1, 0) } : { count: 0 },
			);
			utils.wishlist.isInWishlist.setData(
				{ productId: variables.productId },
				{ isInWishlist: false },
			);

			return { previousCount, previousWishlistStatus };
		},
		onError: (err, variables, context) => {
			if (context?.previousCount) {
				utils.wishlist.getCount.setData(undefined, context.previousCount);
			}
			if (context?.previousWishlistStatus) {
				utils.wishlist.isInWishlist.setData(
					{ productId: variables.productId },
					context.previousWishlistStatus,
				);
			}
		},
	});
};

export const useClearWishlist = () => {
	const utils = api.useUtils();
	return api.wishlist.clearWishlist.useMutation({
		onSuccess: () => {
			utils.wishlist.getItems.invalidate();
			utils.wishlist.getCount.invalidate();
			toast.success("Wishlist cleared!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to clear wishlist");
		},
	});
};

// =============================================================================
// ORDERS HOOKS
// =============================================================================

export const useOrders = (filters?: {
	status?:
		| "pending"
		| "confirmed"
		| "shipped"
		| "delivered"
		| "cancelled"
		| "refunded";
	limit?: number;
	offset?: number;
}) => {
	return api.orders.getMyOrders.useQuery(filters, {
		staleTime: 2 * 60 * 1000,
	});
};

export const useOrder = (id: string) => {
	return api.orders.getById.useQuery(
		{ id },
		{
			enabled: !!id,
			staleTime: 1 * 60 * 1000, // 1 minute for order details
		},
	);
};

export const useCreateOrder = () => {
	const utils = api.useUtils();
	return api.orders.create.useMutation({
		onSuccess: () => {
			utils.orders.getMyOrders.invalidate();
			utils.cart.getItems.invalidate();
			utils.cart.getSummary.invalidate();
			toast.success("Order placed successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to place order");
		},
	});
};

export const useCancelOrder = () => {
	const utils = api.useUtils();
	return api.orders.cancel.useMutation({
		onSuccess: (data, variables) => {
			utils.orders.getById.invalidate({ id: variables.id });
			utils.orders.getMyOrders.invalidate();
			toast.success("Order cancelled successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to cancel order");
		},
	});
};

// Admin Order Hooks
export const useOrderStatistics = () => {
	return api.orders.getStats.useQuery(undefined, {
		staleTime: 5 * 60 * 1000,
	});
};

// Admin-specific order hooks
export const useAllOrders = (filters?: {
	status?:
		| "pending"
		| "confirmed"
		| "shipped"
		| "delivered"
		| "cancelled"
		| "refunded";
	search?: string;
	limit?: number;
	offset?: number;
}) => {
	return api.orders.getAll?.useQuery(filters, {
		staleTime: 2 * 60 * 1000,
	});
};

export const useUpdateOrderStatus = () => {
	const utils = api.useUtils();
	return api.orders.updateStatus?.useMutation({
		onSuccess: (data, variables) => {
			utils.orders.getById.invalidate({ id: variables.id });
			utils.orders.getAll?.invalidate();
			utils.orders.getMyOrders.invalidate();
			toast.success("Order status updated successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update order status");
		},
	});
};

// =============================================================================
// USER HOOKS
// =============================================================================

export const useProfile = () => {
	return api.users.getProfile.useQuery(undefined, {
		staleTime: 10 * 60 * 1000, // Profile data is relatively stable
	});
};

export const useUpdateProfile = () => {
	const utils = api.useUtils();
	return api.users.updateProfile.useMutation({
		onSuccess: () => {
			utils.users.getProfile.invalidate();
			toast.success("Profile updated successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update profile");
		},
	});
};

export const useAddresses = (type?: "shipping" | "billing") => {
	return api.users.getAddresses.useQuery(
		{ type },
		{
			staleTime: 5 * 60 * 1000,
		},
	);
};

export const useAddress = (id: string) => {
	return api.users.getAddressById.useQuery(
		{ id },
		{
			enabled: !!id,
			staleTime: 5 * 60 * 1000,
		},
	);
};

export const useCreateAddress = () => {
	const utils = api.useUtils();
	return api.users.createAddress.useMutation({
		onSuccess: () => {
			utils.users.getAddresses.invalidate();
			toast.success("Address added successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to add address");
		},
	});
};

export const useUpdateAddress = () => {
	const utils = api.useUtils();
	return api.users.updateAddress.useMutation({
		onSuccess: (data) => {
			utils.users.getAddressById.invalidate({ id: data.id });
			utils.users.getAddresses.invalidate();
			toast.success("Address updated successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update address");
		},
	});
};

export const useDeleteAddress = () => {
	const utils = api.useUtils();
	return api.users.deleteAddress.useMutation({
		onSuccess: () => {
			utils.users.getAddresses.invalidate();
			toast.success("Address deleted successfully!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete address");
		},
	});
};

export const useSetDefaultAddress = () => {
	const utils = api.useUtils();
	return api.users.setDefaultAddress.useMutation({
		onSuccess: () => {
			utils.users.getAddresses.invalidate();
			toast.success("Default address updated!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update default address");
		},
	});
};

// Admin User Hooks
export const useAllUsers = (filters?: {
	search?: string;
	role?: "user" | "admin";
	blocked?: boolean;
	limit?: number;
	offset?: number;
}) => {
	return api.users.getAllUsers.useQuery(filters, {
		staleTime: 2 * 60 * 1000,
	});
};

export const useUser = (id: string) => {
	return api.users.getById.useQuery(
		{ id },
		{
			enabled: !!id,
			staleTime: 5 * 60 * 1000,
		},
	);
};

export const useUserOrders = (userId: string) => {
	return api.orders.getUserOrders.useQuery(
		{ userId },
		{
			enabled: !!userId,
			staleTime: 2 * 60 * 1000,
		},
	);
};

export const useToggleUserBlock = () => {
	const utils = api.useUtils();
	return api.users.toggleUserBlock.useMutation({
		onSuccess: () => {
			utils.users.getAllUsers.invalidate();
			toast.success("User status updated!");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update user status");
		},
	});
};

// =============================================================================
// COUPON HOOKS
// =============================================================================

export const useCouponByCode = (code: string) => {
	return api.coupons.getCouponByCode.useQuery(
		{ code },
		{
			enabled: !!code,
			staleTime: 5 * 60 * 1000, // 5 minutes
		},
	);
};

// =============================================================================
// COMBINED HOOKS FOR COMPLEX OPERATIONS
// =============================================================================

export const useProductWithDetails = (slug: string) => {
	const productQuery = useProductBySlug(slug);
	const imagesQuery = useProductImages(productQuery.data?.id || "");
	const reviewsQuery = useProductReviews(productQuery.data?.id || "");

	return {
		product: productQuery.data,
		images: imagesQuery.data,
		reviews: reviewsQuery.data,
		isPending: productQuery.isPending || imagesQuery.isPending,
		error: productQuery.error || imagesQuery.error || reviewsQuery.error,
	};
};

export const useCartWithSummary = () => {
	const cartQuery = useCart();
	const summaryQuery = useCartSummary();

	return {
		items: cartQuery.data || [],
		summary: summaryQuery.data,
		isPending: cartQuery.isPending || summaryQuery.isPending,
		error: cartQuery.error || summaryQuery.error,
	};
};

export const useShippingAddresses = () => {
	return useAddresses("shipping");
};

export const useBillingAddresses = () => {
	return useAddresses("billing");
};

export const useWishlistToggle = (productId: string) => {
	const { data: isInWishlist } = useIsInWishlist(productId);
	const addToWishlist = useAddToWishlist();
	const removeFromWishlist = useRemoveFromWishlistByProductId();

	const toggle = async () => {
		if (isInWishlist?.isInWishlist) {
			await removeFromWishlist.mutateAsync({ productId });
		} else {
			await addToWishlist.mutateAsync({ productId });
		}
	};

	return {
		isInWishlist: isInWishlist?.isInWishlist || false,
		toggle,
		isPending: addToWishlist.isPending || removeFromWishlist.isPending,
	};
};

// Shopping flow hooks
export const useCheckoutFlow = () => {
	const { items, summary } = useCartWithSummary();
	const createOrder = useCreateOrder();
	const { data: shippingAddresses } = useShippingAddresses();
	const { data: billingAddresses } = useBillingAddresses();

	return {
		cartItems: items,
		cartSummary: summary,
		createOrder,
		shippingAddresses: shippingAddresses || [],
		billingAddresses: billingAddresses || [],
		isReady: items.length > 0 && summary,
	};
};
