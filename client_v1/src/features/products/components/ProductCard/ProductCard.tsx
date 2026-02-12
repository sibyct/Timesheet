import React from 'react'
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import type { Product, ProductStatus } from '../../types/product.types'

interface ProductCardProps {
  product: Product
  onDelete?: (id: string) => void
}

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

export const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  const navigate = useNavigate()

  const handleView = () => {
    navigate(`/products/${product.id}`)
  }

  const handleEdit = () => {
    navigate(`/products/${product.id}/edit`)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(product.id)
    }
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="200"
        image={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {product.name}
          </Typography>
          <Chip
            label={product.status}
            color={getStatusColor(product.status)}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {product.description.length > 100
            ? `${product.description.substring(0, 100)}...`
            : product.description}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="h6" color="primary">
            ${product.price.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stock: {product.stock}
          </Typography>
        </Box>
        
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          SKU: {product.sku}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Category: {product.category}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={handleView}
        >
          View
        </Button>
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={handleEdit}
            aria-label="edit"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={handleDelete}
            aria-label="delete"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  )
}