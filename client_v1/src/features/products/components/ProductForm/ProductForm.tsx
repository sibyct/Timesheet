import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { productSchema, type ProductFormData } from '../../schemas/product.schema'
import { ProductStatus } from '../../types/product.types'
import type { Product } from '../../types/product.types'

interface ProductFormProps {
  product?: Product
  onSubmit: (data: ProductFormData) => void
  isLoading?: boolean
}

const categories = [
  'Electronics',
  'Clothing',
  'Food & Beverage',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Toys & Games',
  'Health & Beauty',
]

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  isLoading = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    mode: 'onBlur',
    defaultValues: product || {
      name: '',
      description: '',
      price: 0,
      category: '',
      sku: '',
      stock: 0,
      imageUrl: '',
      status: ProductStatus.ACTIVE,
    },
  })

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid container spacing={3}>
        {/* Product Name */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Product Name"
                error={!!errors.name}
                helperText={errors.name?.message}
                required
              />
            )}
          />
        </Grid>

        {/* SKU */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="sku"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="SKU"
                placeholder="PROD-001"
                error={!!errors.sku}
                helperText={errors.sku?.message}
                required
              />
            )}
          />
        </Grid>

        {/* Description */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Description"
                multiline
                rows={4}
                error={!!errors.description}
                helperText={errors.description?.message}
                required
              />
            )}
          />
        </Grid>

        {/* Price */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Price"
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                error={!!errors.price}
                helperText={errors.price?.message}
                required
              />
            )}
          />
        </Grid>

        {/* Stock */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Controller
            name="stock"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Stock Quantity"
                type="number"
                inputProps={{ step: '1', min: '0' }}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                error={!!errors.stock}
                helperText={errors.stock?.message}
                required
              />
            )}
          />
        </Grid>

        {/* Status */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.status}>
                <InputLabel>Status</InputLabel>
                <Select {...field} label="Status">
                  {Object.values(ProductStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
                {errors.status && (
                  <FormHelperText>{errors.status.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        {/* Category */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.category} required>
                <InputLabel>Category</InputLabel>
                <Select {...field} label="Category">
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <FormHelperText>{errors.category.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        {/* Image URL */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="imageUrl"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Image URL"
                placeholder="https://example.com/image.jpg"
                error={!!errors.imageUrl}
                helperText={errors.imageUrl?.message}
              />
            )}
          />
        </Grid>

        {/* Submit Button */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => window.history.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isLoading}
              loadingPosition="start"
            >
              {product ? 'Update Product' : 'Create Product'}
            </LoadingButton>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}