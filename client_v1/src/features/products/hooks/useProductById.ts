import { useQuery } from '@tanstack/react-query'
import { productsApi } from '../api/products.api'

export const useProductById = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.getProductById(id),
    enabled: !!id,
  })
}