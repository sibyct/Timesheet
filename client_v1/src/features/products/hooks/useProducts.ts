import { useQuery } from '@tanstack/react-query'
import { productsApi } from '../api/products.api'
import type { ProductFilters } from '../types/product.types'

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}