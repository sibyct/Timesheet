import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Alert,
  Snackbar,
} from '@mui/material'
import { Breadcrumbs } from '@/shared/layout/Breadcrumbs';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ProductForm } from '../../components/ProductForm';
import { useProductById } from '../../hooks/useProductById';
import { useUpdateProduct } from '../../hooks/useUpdateProduct';
import type { ProductFormData } from '../../schemas/product.schema'

const ProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const { data: product, isLoading } = useProductById(id!)
  const updateMutation = useUpdateProduct()

  const handleSubmit = async (data: ProductFormData) => {
    if (!id) return

    try {
      await updateMutation.mutateAsync({ id, data })
      setSnackbar({
        open: true,
        message: 'Product updated successfully',
        severity: 'success',
      })
      setTimeout(() => navigate(`/products/${id}`), 1500)
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update product',
        severity: 'error',
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!product) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Product not found
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Breadcrumbs />

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Edit Product
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Update product information
        </Typography>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 4 }}>
        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
        />
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ProductEditPage