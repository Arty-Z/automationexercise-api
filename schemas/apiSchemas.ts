/**
 * Product entity interface
 */
export interface Product {
  id: number;
  name: string;
  price: string;
  brand: string;
  category: {
    usertype: {
      usertype: string;
    };
    category: string;
  };
}

/**
 * Products List API Response
 */
export interface ProductsListResponse {
  responseCode: number;
  products: Product[];
}

/**
 * Search Product API Request
 */
export interface SearchProductRequest {
  search_product: string;
}

/**
 * Search Product API Response
 */
export interface SearchProductResponse {
  responseCode: number;
  products: Product[];
}

/**
 * Brand entity interface
 */
export interface Brand {
  id: number;
  brand: string;
}

/**
 * Brands List API Response
 */
export interface BrandsListResponse {
  responseCode: number;
  brands: Brand[];
}

/**
 * Generic API Error Response
 */
export interface ApiErrorResponse {
  responseCode: number;
  message?: string;
}
