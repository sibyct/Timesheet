import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '../api/products.api'

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['products', deletedId] })
      
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}