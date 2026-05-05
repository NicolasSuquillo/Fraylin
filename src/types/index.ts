export interface ProductImage {
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  category: string;
  name: string;
  price?: string;
  description?: string;
  images: ProductImage[];
  featured?: boolean;
}

export interface Category {
  slug: string;
  label: string;
  icon: string;
  description?: string;
}

export interface GalleryItem {
  src: string;
  alt: string;
  caption?: string;
}

export interface Service {
  title: string;
  description: string;
  icon: string;
}
