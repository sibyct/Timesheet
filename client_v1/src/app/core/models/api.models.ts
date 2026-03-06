/** Standard success envelope from the server. */
export interface ApiResponse<T> {
  success: true;
  message: string;
  data:    T;
}

/** Paginated success envelope. */
export interface PaginatedResponse<T> {
  success: true;
  message: string;
  data:    T[];
  meta:    PaginationMeta;
}

export interface PaginationMeta {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}
