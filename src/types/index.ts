export type UserRole = 'admin' | 'representative' | 'customer' | 'guest'

export interface User {
  id: string
  email: string
  phone?: string
  full_name: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Representative {
  id: string
  user_id: string
  store_name: string
  store_slug: string
  description?: string
  logo_url?: string
  cover_url?: string
  phone?: string
  location?: string
  is_visible: boolean
  created_at: string
  updated_at: string
  user?: User
  products_count?: number
  orders_count?: number
}

export interface Category {
  id: string
  name: string
  slug: string
  image_url?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  products_count?: number
}

export interface Product {
  id: string
  representative_id: string
  category_id: string
  name: string
  slug: string
  description?: string
  price: number
  discount_price?: number
  stock_quantity: number
  main_image?: string
  is_active: boolean
  created_at: string
  updated_at: string
  representative?: Representative
  category?: Category
  images?: ProductImage[]
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  sort_order: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_phone_verified: boolean
  delivery_address: string
  notes?: string
  subtotal: number
  delivery_fee: number
  total: number
  status: OrderStatus
  created_at: string
  updated_at: string
  vendor_orders?: VendorOrder[]
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface VendorOrder {
  id: string
  order_id: string
  representative_id: string
  subtotal: number
  delivery_fee: number
  total: number
  status: OrderStatus
  created_at: string
  updated_at: string
  order?: Order
  representative?: Representative
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  vendor_order_id: string
  product_id: string
  product_name_snapshot: string
  product_price_snapshot: number
  quantity: number
  total: number
  product?: Product
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

export type NotificationType =
  | 'new_order'
  | 'order_accepted'
  | 'order_rejected'
  | 'order_status_changed'
  | 'product_approved'
  | 'product_rejected'
  | 'admin_announcement'
  | 'general'

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export interface Banner {
  id: string
  title: string
  image_url: string
  target_url?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StoreSettings {
  id: string
  key: string
  value: string
  updated_at: string
}

export interface OrderStatusHistory {
  id: string
  vendor_order_id: string
  old_status: OrderStatus
  new_status: OrderStatus
  changed_by: string
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface CheckoutData {
  customer_name: string
  customer_phone: string
  delivery_address: string
  notes?: string
  cart_items: CartItem[]
}

export interface PhoneVerificationData {
  phone: string
  otp: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  phone?: string
}

export interface CreateRepresentativeData {
  email: string
  password: string
  full_name: string
  store_name: string
  phone: string
  location?: string
}

export interface CreateProductData {
  name: string
  description?: string
  price: number
  discount_price?: number
  stock_quantity: number
  category_id: string
  main_image?: File
  images?: File[]
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string
  is_active?: boolean
}

export interface UpdateOrderStatusData {
  vendor_order_id: string
  status: OrderStatus
  reason?: string
}

export interface SearchFilters {
  query?: string
  category_id?: string
  min_price?: number
  max_price?: number
  representative_id?: string
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
  page?: number
  page_size?: number
}

export interface ProductFilters extends SearchFilters {
  is_active?: boolean
}

export interface OrderFilters {
  status?: OrderStatus
  representative_id?: string
  customer_phone?: string
  order_number?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

export interface DashboardStats {
  total_representatives: number
  active_representatives: number
  total_products: number
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_sales: number
  recent_activity: ActivityItem[]
}

export interface RepresentativeStats {
  total_products: number
  active_products: number
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_sales: number
  recent_orders: VendorOrder[]
  top_products: Product[]
}

export interface ActivityItem {
  id: string
  type: string
  description: string
  created_at: string
  user?: User
  representative?: Representative
}