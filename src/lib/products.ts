import productsData from "../data/products.json";
import type { Product, Category } from "@/types";

export function getAllProducts(): Product[] {
  return productsData.products as Product[];
}

export function getCategories(): Category[] {
  return productsData.categories as Category[];
}

export function getProductsByCategory(slug: string): Product[] {
  return (productsData.products as Product[]).filter(
    (p) => p.category === slug
  );
}

export function getFeaturedProducts(): Product[] {
  return (productsData.products as Product[]).filter((p) => p.featured);
}
