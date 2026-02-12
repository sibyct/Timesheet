
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  sku: string
  stock: number
  imageUrl?: string
  images?: string[]
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

export interface CreateProductData {
  name: string
  description: string
  price: number
  category: string
  sku: string
  stock: number
  imageUrl?: string
  images?: string[]
  status?: ProductStatus
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface ProductFilters {
  search?: string
  category?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}

export interface ProductsResponse {
  data: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}