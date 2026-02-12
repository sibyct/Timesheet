import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '../api/products.api'
import type { UpdateProductData } from '../types/product.types'

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) =>
      productsApi.updateProduct(id, data),
    onSuccess: (updatedProduct) => {
      // Update cache
      queryClient.setQueryData(['products', updatedProduct.id], updatedProduct)
      
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}