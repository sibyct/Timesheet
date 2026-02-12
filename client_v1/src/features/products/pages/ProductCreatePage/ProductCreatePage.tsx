import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Alert,
  Snackbar,
} from '@mui/material';
import { Breadcrumbs } from '@/shared/layout/Breadcrumbs';
import { ProductForm } from '../../components/ProductForm';
import { useCreateProduct } from '../../hooks/useCreateProduct';
import type { ProductFormData } from '../../schemas/product.schema';

const ProductCreatePage: React.FC = () => {
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  const createMutation = useCreateProduct()

  const handleSubmit = async (data: ProductFormData) => {
    try {
      await createMutation.mutateAsync(data)
      setSnackbar({
        open: true,
        message: 'Product created successfully',
        severity: 'success',
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create product',
        severity: 'error',
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Box>
      <Breadcrumbs />

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Create New Product
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Add a new product to your inventory
        </Typography>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 4 }}>
        <ProductForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
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

export default ProductCreatePage