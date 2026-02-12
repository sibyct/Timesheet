import React from 'react'
import { Grid, Typography, Box, Alert } from '@mui/material'
import { ProductCard } from '../ProductCard'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { Product } from '../../types/product.types'

interface ProductListProps {
  products: Product[]
  isLoading: boolean
  error: Error | null
  onDelete: (id: string) => void
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  error,
  onDelete,
}) => {
  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading products: {error.message}
      </Alert>
    )
  }

  if (products.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No products found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Try adjusting your filters or create a new product
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={3}>
      {products.map((product) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
          <ProductCard product={product} onDelete={onDelete} />
        </Grid>
      ))}
    </Grid>
  )
}