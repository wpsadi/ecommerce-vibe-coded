"use client";

import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
} from "react";

interface CartItem {
	id: string;
	name: string;
	price: number;
	image: string;
	quantity: number;
	stock: number;
}

interface CartContextType {
	items: CartItem[];
	addToCart: (product: Omit<CartItem, "quantity">) => void;
	removeFromCart: (id: string) => void;
	updateQuantity: (id: string, quantity: number) => void;
	clearCart: () => void;
	totalItems: number;
	totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<CartItem[]>([]);

	useEffect(() => {
		const storedCart = localStorage.getItem("cart");
		if (storedCart) {
			setItems(JSON.parse(storedCart));
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("cart", JSON.stringify(items));
	}, [items]);

	const addToCart = (product: Omit<CartItem, "quantity">) => {
		setItems((prev) => {
			const existingItem = prev.find((item) => item.id === product.id);
			if (existingItem) {
				return prev.map((item) =>
					item.id === product.id
						? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
						: item,
				);
			}
			return [...prev, { ...product, quantity: 1 }];
		});
	};

	const removeFromCart = (id: string) => {
		setItems((prev) => prev.filter((item) => item.id !== id));
	};

	const updateQuantity = (id: string, quantity: number) => {
		if (quantity <= 0) {
			removeFromCart(id);
			return;
		}

		setItems((prev) =>
			prev.map((item) =>
				item.id === id
					? { ...item, quantity: Math.min(quantity, item.stock) }
					: item,
			),
		);
	};

	const clearCart = () => {
		setItems([]);
	};

	const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
	const totalPrice = items.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);

	return (
		<CartContext.Provider
			value={{
				items,
				addToCart,
				removeFromCart,
				updateQuantity,
				clearCart,
				totalItems,
				totalPrice,
			}}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart() {
	const context = useContext(CartContext);
	if (context === undefined) {
		throw new Error("useCart must be used within a CartProvider");
	}
	return context;
}
