export const PRODUCTS_ENDPOINTS = {
  BASE: '/products',
  BY_ID: (id: string) => `/products/${id}`,
  CATEGORIES: '/products/categories',
  SEARCH: '/products/search',
} as const