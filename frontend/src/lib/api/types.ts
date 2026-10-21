/** Mirrors the backend DTO records (BigDecimal values are serialised as JSON numbers). */

export type Role = "CUSTOMER" | "ADMIN";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "CREATED" | "SUCCEEDED" | "FAILED" | "EXPIRED" | "REFUNDED";

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  requestId?: string;
  fieldErrors?: ApiFieldError[];
}

// auth + user
export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface UpdateProfileRequest {
  fullName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// catalog
export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  productCount: number;
  children: CategoryResponse[];
}

export interface CategoryRequest {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: number | null;
}

export interface ProductImage {
  id: number;
  url: string;
  position: number;
}

export interface ProductCategorySummary {
  id: number;
  name: string;
  slug: string;
}

export interface ProductResponse {
  id: number;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  active: boolean;
  category: ProductCategorySummary | null;
  images: ProductImage[];
  inStock: boolean;
  createdAt: string;
}

export interface AdminProductResponse extends ProductResponse {
  stock: number;
}

export interface ProductRequest {
  sku: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  categoryId: number;
  active?: boolean;
  initialStock?: number;
}

export type ProductSortField = "price" | "name" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface ProductListParams {
  page?: number;
  size?: number;
  /** "field,direction", for example "price,asc". */
  sort?: string;
  q?: string;
  category?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

// cart
export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  lineTotal: number;
  canIncreaseQuantity: boolean;
}

export interface CartResponse {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  currency: string;
}

// orders + payments
export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderResponse {
  id: number;
  userId: number;
  status: OrderStatus;
  total: number;
  currency: string;
  shippingAddress: ShippingAddress | null;
  items: OrderItem[];
  createdAt: string;
}

export interface CheckoutRequest {
  shippingAddress: ShippingAddress;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PaymentResponse {
  id: number;
  orderId: number;
  status: PaymentStatus;
  amount: number;
  currency: string;
  createdAt: string;
}

// admin
export interface InventoryResponse {
  productId: number;
  sku: string;
  name: string;
  quantityOnHand: number;
  lowStock: boolean;
}

export interface AdjustStockRequest {
  delta: number;
  note?: string | null;
}

export interface DashboardStats {
  totalRevenue: number;
  orderCount: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  customerCount: number;
  lowStockCount: number;
  revenueLast30Days: { date: string; revenue: number }[];
  topProducts: { productId: number; name: string; unitsSold: number; revenue: number }[];
}
