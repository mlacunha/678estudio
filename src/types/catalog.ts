export type CategorySlug = 'quadros' | 'canecas' | 'papelaria' | 'artesanato';

export interface Product {
  id: string;
  name: string;
  categorySlug: CategorySlug;
  tagline: string;
  description: string;
  featuredBadge?: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  isProvisional: boolean;
  isFeatured?: boolean;
  linkedArteId?: string;
}

export interface ProductCategory {
  id: string;
  slug: CategorySlug;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
}

