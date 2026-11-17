import type {
  CategoryDestinationType,
  CategoryLayoutType,
  ProductActionType,
} from '../data/internalDestinations';

export type { CategoryDestinationType, CategoryLayoutType, ProductActionType };

export type CategorySlug = string;

export interface Product {
  id: string;
  categoryId?: string;
  categorySlug: CategorySlug;
  categoryTitle?: string;
  name: string;
  tagline: string;
  description: string;
  featuredBadge?: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  isProvisional: boolean;
  isFeatured?: boolean;
  linkedArteId?: string;
  actionType?: ProductActionType;
  actionHref?: string;
  ctaLabel?: string;
}

export interface ProductCategory {
  id: string;
  slug: CategorySlug;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  coverImageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  showOnHome?: boolean;
  layoutType?: CategoryLayoutType;
  destinationType?: CategoryDestinationType;
  destinationHref?: string;
  defaultProductAction?: ProductActionType;
  defaultProductHref?: string;
}

export interface CategorySlugAlias {
  slug: string;
  categoryId: string;
  createdAt: string;
}

export interface AdminCategorySummary extends ProductCategory {
  displayOrder: number;
  isActive: boolean;
  showOnHome: boolean;
  productCount: number;
  workCount: number;
  aliases: string[];
}

export interface AdminProductFilters {
  q?: string;
  categoryId?: string;
  categorySlug?: string;
  status?: 'all' | 'active' | 'inactive';
  featured?: 'all' | 'featured' | 'regular';
  page?: number;
  pageSize?: number;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
