import { categories, mockProducts } from "@/lib/mock-data";
import type { Category, Product } from "@/lib/mock-data";

// In-memory storage that persists during server runtime
// In a real application, this would be replaced with actual database operations
let productsStorage: Product[] = [...mockProducts];
let categoriesStorage: Category[] = [...categories];

export class MockDatabase {
	static getProducts(): Product[] {
		return [...productsStorage];
	}

	static saveProducts(products: Product[]): void {
		productsStorage = [...products];
	}

	static getCategories(): Category[] {
		return [...categoriesStorage];
	}

	static saveCategories(categories: Category[]): void {
		categoriesStorage = [...categories];
	}

	static findProductById(id: string): Product | undefined {
		return productsStorage.find((p) => p.id === id);
	}

	static updateProduct(id: string, updates: Partial<Product>): Product | null {
		const index = productsStorage.findIndex((p) => p.id === id);

		if (index === -1) {
			return null;
		}

		productsStorage[index] = { ...productsStorage[index], ...updates };
		return productsStorage[index];
	}

	static deleteProduct(id: string): Product | null {
		const index = productsStorage.findIndex((p) => p.id === id);

		if (index === -1) {
			return null;
		}

		const deletedProduct = productsStorage[index];
		productsStorage.splice(index, 1);
		return deletedProduct;
	}

	static createProduct(product: Omit<Product, "id">): Product {
		const newProduct: Product = {
			...product,
			id: crypto.randomUUID(),
		};

		productsStorage.push(newProduct);
		return newProduct;
	}

	static resetToDefaults(): void {
		productsStorage = [...mockProducts];
		categoriesStorage = [...categories];
	}
}
