"use client";

import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
} from "react";

interface WishlistItem {
	id: string;
	name: string;
	price: number;
	image: string;
	originalPrice?: number;
}

interface WishlistContextType {
	items: WishlistItem[];
	addToWishlist: (product: WishlistItem) => void;
	removeFromWishlist: (id: string) => void;
	isInWishlist: (id: string) => boolean;
	clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
	undefined,
);

export function WishlistProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<WishlistItem[]>([]);

	useEffect(() => {
		const storedWishlist = localStorage.getItem("wishlist");
		if (storedWishlist) {
			setItems(JSON.parse(storedWishlist));
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("wishlist", JSON.stringify(items));
	}, [items]);

	const addToWishlist = (product: WishlistItem) => {
		setItems((prev) => {
			const exists = prev.find((item) => item.id === product.id);
			if (exists) return prev;
			return [...prev, product];
		});
	};

	const removeFromWishlist = (id: string) => {
		setItems((prev) => prev.filter((item) => item.id !== id));
	};

	const isInWishlist = (id: string) => {
		return items.some((item) => item.id === id);
	};

	const clearWishlist = () => {
		setItems([]);
	};

	return (
		<WishlistContext.Provider
			value={{
				items,
				addToWishlist,
				removeFromWishlist,
				isInWishlist,
				clearWishlist,
			}}
		>
			{children}
		</WishlistContext.Provider>
	);
}

export function useWishlist() {
	const context = useContext(WishlistContext);
	if (context === undefined) {
		throw new Error("useWishlist must be used within a WishlistProvider");
	}
	return context;
}
