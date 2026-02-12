import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, ArrowBack } from '@mui/icons-material'
import { Breadcrumbs } from '@/shared/layout/Breadcrumbs';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useProductById } from '../../hooks/useProductById';
import { ProductStatus } from '../../types/product.types';

const getStatusColor = (status: ProductStatus): 'success' | 'error' | 'warning' | 'default' => {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'INACTIVE':
      return 'default'
    case 'OUT_OF_STOCK':
      return 'error'
    case 'DISCONTINUED':
      return 'warning'
    default:
      return 'default'
  }
}

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading, error } = useProductById(id!)

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !product) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/products')}
            sx={{ mb: 2 }}
          >
            Back to Products
          </Button>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            {product.name}
          </Typography>
          <Chip label={product.status} color={getStatusColor(product.status)} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/products/${id}/edit`)}
          >
            Edit
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />}>
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Image */}
        <Grid size={{xs:12, md:5}}>
          <Paper sx={{ p: 2 }}>
            <Box
              component="img"
              src={product.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'}
              alt={product.name}
              sx={{ width: '100%', borderRadius: 1 }}
            />
          </Paper>
        </Grid>

        {/* Details */}
        <Grid size={{xs:12, md:7}}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Product Details
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid size={{xs:6}}>
                <Typography variant="body2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="h6" color="primary">
                  ${product.price.toFixed(2)}
                </Typography>
              </Grid>

              <Grid size={{xs:6}}>
                <Typography variant="body2" color="text.secondary">
                  Stock
                </Typography>
                <Typography variant="h6">{product.stock} units</Typography>
              </Grid>

              <Grid size={{xs:6}}>
                <Typography variant="body2" color="text.secondary">
                  SKU
                </Typography>
                <Typography variant="body1">{product.sku}</Typography>
              </Grid>

              <Grid size={{xs:6}}>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">{product.category}</Typography>
              </Grid>

              <Grid size={{xs:12}}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1">{product.description}</Typography>
              </Grid>

              <Grid size={{xs:6}}>
                <Typography variant="body2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body2">
                  {new Date(product.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>

              <Grid size={{xs:6}}>
                <Typography variant="body2" color="text.secondary">
                  Updated At
                </Typography>
                <Typography variant="body2">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProductDetailsPage