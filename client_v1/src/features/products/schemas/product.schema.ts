import { z } from 'zod'
import { ProductStatus } from '../types/product.types'

const productStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]),
})

export type ProductStatusType = z.infer<typeof productStatusSchema.shape.status>

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .min(3, 'Product name must be at least 3 characters')
    .max(100, 'Product name must not exceed 100 characters'),
  
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(1000000, 'Price is too high'),
  
  category: z
    .string()
    .min(1, 'Category is required'),
  
  sku: z
    .string()
    .min(1, 'SKU is required')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  
  stock: z
    .number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
  
  imageUrl: z
    .string()
    .url('Invalid image URL')
    .optional()
    .or(z.literal('')),
  
  status: z
    .enum([ProductStatus.ACTIVE, ProductStatus.INACTIVE,ProductStatus.OUT_OF_STOCK,ProductStatus.DISCONTINUED])
    .optional()
    //.default(ProductStatus.ACTIVE),
})

export type ProductFormData = z.infer<typeof productSchema>
