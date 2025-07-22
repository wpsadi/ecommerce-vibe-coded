import { db } from "../src/server/db/index";
import { categories, products, productImages } from "../src/server/db/schema-pg";

async function seed() {
	console.log("🌱 Seeding database...");

	// Insert categories
	const sampleCategories = [
		{
			id: "cat-1",
			name: "Electronics",
			slug: "electronics",
			description: "Electronic devices and gadgets",
			icon: "📱",
			featured: true,
			active: true,
			sortOrder: 1,
		},
		{
			id: "cat-2", 
			name: "Clothing",
			slug: "clothing",
			description: "Fashion and apparel",
			icon: "👕",
			featured: true,
			active: true,
			sortOrder: 2,
		},
		{
			id: "cat-3",
			name: "Books",
			slug: "books", 
			description: "Books and literature",
			icon: "📚",
			featured: false,
			active: true,
			sortOrder: 3,
		},
	];

	await db.insert(categories).values(sampleCategories);
	console.log("✅ Categories seeded");

	// Insert products
	const sampleProducts = [
		{
			id: "prod-1",
			name: "iPhone 15 Pro",
			slug: "iphone-15-pro",
			description: "Latest iPhone with advanced camera and performance",
			shortDescription: "Premium smartphone with Pro features",
			sku: "IPH15PRO001",
			price: "99999",
			originalPrice: "109999",
			categoryId: "cat-1",
			stock: 50,
			featured: true,
			active: true,
		},
		{
			id: "prod-2", 
			name: "Samsung Galaxy S24",
			slug: "samsung-galaxy-s24",
			description: "Flagship Android phone with AI features",
			shortDescription: "Advanced Android smartphone",
			sku: "SAM24001",
			price: "79999",
			originalPrice: "84999",
			categoryId: "cat-1",
			stock: 30,
			featured: true,
			active: true,
		},
		{
			id: "prod-3",
			name: "MacBook Air M3",
			slug: "macbook-air-m3",
			description: "Ultra-thin laptop with M3 chip and all-day battery",
			shortDescription: "Powerful ultrabook for professionals",
			sku: "MBA3001",
			price: "114900",
			originalPrice: "119900",
			categoryId: "cat-1",
			stock: 20,
			featured: true,
			active: true,
		},
		{
			id: "prod-4",
			name: "Cotton T-Shirt",
			slug: "cotton-t-shirt",
			description: "Comfortable 100% cotton t-shirt in various colors",
			shortDescription: "Basic cotton tee",
			sku: "TSH001",
			price: "799",
			originalPrice: "999",
			categoryId: "cat-2",
			stock: 100,
			featured: false,
			active: true,
		},
		{
			id: "prod-5",
			name: "Denim Jeans",
			slug: "denim-jeans",
			description: "Classic blue denim jeans with comfortable fit",
			shortDescription: "Stylish denim jeans",
			sku: "JNS001",
			price: "2499",
			originalPrice: "2999",
			categoryId: "cat-2", 
			stock: 75,
			featured: false,
			active: true,
		},
		{
			id: "prod-6",
			name: "The Alchemist",
			slug: "the-alchemist",
			description: "Bestselling novel by Paulo Coelho",
			shortDescription: "Inspirational fiction novel",
			sku: "BK001",
			price: "299",
			originalPrice: "399",
			categoryId: "cat-3",
			stock: 200,
			featured: false,
			active: true,
		},
	];

	await db.insert(products).values(sampleProducts);
	console.log("✅ Products seeded");

	// Insert product images
	const sampleImages = [
		{ productId: "prod-1", url: "https://images.unsplash.com/photo-1592910152066-2f3aa8eebcc3?w=500", isPrimary: true, sortOrder: 0 },
		{ productId: "prod-2", url: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500", isPrimary: true, sortOrder: 0 },
		{ productId: "prod-3", url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500", isPrimary: true, sortOrder: 0 },
		{ productId: "prod-4", url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500", isPrimary: true, sortOrder: 0 },
		{ productId: "prod-5", url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500", isPrimary: true, sortOrder: 0 },
		{ productId: "prod-6", url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500", isPrimary: true, sortOrder: 0 },
	];

	await db.insert(productImages).values(sampleImages);
	console.log("✅ Product images seeded");

	console.log("🎉 Database seeded successfully!");
}

seed().catch(console.error);