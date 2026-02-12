import { apiClient } from '@/services/api/client'
import { PRODUCTS_ENDPOINTS } from './products.endpoints'
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductFilters,
  ProductsResponse,
} from '../types/product.types'

export const productsApi = {
  /**
   * Get all products with filters
   */
  getProducts: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    return apiClient.get(PRODUCTS_ENDPOINTS.BASE, { params: filters })
  },

  /**
   * Get product by ID
   */
  getProductById: async (id: string): Promise<Product> => {
    return apiClient.get(PRODUCTS_ENDPOINTS.BY_ID(id))
  },

  /**
   * Create new product
   */
  createProduct: async (data: CreateProductData): Promise<Product> => {
    return apiClient.post(PRODUCTS_ENDPOINTS.BASE, data)
  },

  /**
   * Update product
   */
  updateProduct: async (id: string, data: UpdateProductData): Promise<Product> => {
    return apiClient.put(PRODUCTS_ENDPOINTS.BY_ID(id), data)
  },

  /**
   * Delete product
   */
  deleteProduct: async (id: string): Promise<void> => {
    return apiClient.delete(PRODUCTS_ENDPOINTS.BY_ID(id))
  },

  /**
   * Get product categories
   */
  getCategories: async (): Promise<string[]> => {
    return apiClient.get(PRODUCTS_ENDPOINTS.CATEGORIES)
  },
}