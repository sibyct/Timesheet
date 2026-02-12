import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { productsApi } from '../api/products.api'
import type { CreateProductData } from '../types/product.types'

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: CreateProductData) => productsApi.createProduct(data),
    onSuccess: (newProduct) => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: ['products'] })
      
      // Optionally add to cache
      queryClient.setQueryData(['products', newProduct.id], newProduct)
      
      // Navigate to products list
      navigate('/products')
    },
  })
}