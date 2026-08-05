export interface Category {
  id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  tagline?: string | null;
  image?: string | null;
  banner_image?: string | null;
  icon?: string | null;
  sort_order?: number;
  is_featured?: boolean;
  status?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id?: string;
  product_id?: string;
  image_path: string;
  alt_text?: string | null;
  sort_order?: number;
  is_primary?: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  seller_id?: string;
  category_id: string | null;
  name: string;
  slug: string;
  sku?: string | null;
  short_desc?: string | null;
  short_description?: string | null;
  long_desc?: string | null;
  description?: string | null;
  features: string[];
  specs: Record<string, string>;
  specifications?: Record<string, any> | string | null;
  dimensions?: Record<string, any> | string | null;
  material?: string | null;
  color?: string | null;
  warranty_months?: number | null;
  min_order_quantity?: number;
  max_order_quantity?: number | null;
  unit?: string;
  price?: number | null;
  discount_price?: number | null;
  discount_percentage?: number | null;
  tax_percentage?: number;
  stock_quantity?: number;
  availability_status?: string;
  is_approved?: boolean;
  approved_at?: string | null;
  approved_by?: string | null;
  featured?: boolean;
  is_featured?: boolean;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  rating?: number;
  total_reviews?: number;
  total_views?: number;
  total_orders?: number;
  status?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  image?: string | null;
  gallery?: string[];
  images?: ProductImage[];
  price_range?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Seller {
  id: string;
  user_id: string;
  company_name: string;
  company_logo?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  registration_number?: string | null;
  business_type?: string;
  description?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  pincode?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  website?: string | null;
  established_year?: number | null;
  total_employees?: string | null;
  annual_turnover?: string | null;
  certifications?: any;
  bank_details?: any;
  verification_status?: string;
  verification_remarks?: string | null;
  verified_at?: string | null;
  rating?: number;
  total_reviews?: number;
  total_products?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string | null;
  };
}

export interface Buyer {
  id: string;
  user_id: string;
  company_name?: string | null;
  company_logo?: string | null;
  gst_number?: string | null;
  business_type?: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  pincode?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  website?: string | null;
  total_orders?: number;
  total_spent?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string | null;
  };
}

export interface PurchaseRequirement {
  id: string;
  buyer_id: string;
  category_id?: string | null;
  title: string;
  slug: string;
  description: string;
  product_name?: string | null;
  required_quantity: number;
  unit?: string;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_location?: string | null;
  required_by_date?: string | null;
  specifications?: any;
  attachments?: any;
  total_quotes_received?: number;
  status?: string;
  visibility?: string;
  expires_at?: string | null;
  awarded_to?: string | null;
  awarded_at?: string | null;
  created_at?: string;
  updated_at?: string;
  buyer?: {
    company_name?: string | null;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatar?: string | null;
  status?: string;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  order_number?: string;
  buyer_id?: string;
  seller_id?: string;
  product_id?: string;
  quantity?: number;
  unit_price?: number;
  total_amount?: number;
  status?: string;
  payment_status?: string;
  shipping_address?: any;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  buyer?: { company_name?: string | null };
  product?: { name?: string };
}

export interface RFQ {
  id: string;
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  category?: string;
  product_name?: string;
  quantity?: number;
  budget_range_min?: number | null;
  budget_range_max?: number | null;
  required_date?: string | null;
  description?: string;
  status?: string;
  is_read?: boolean;
  created_at?: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  subject: string;
  message: string;
  type?: string;
  priority?: string;
  is_read?: boolean;
  is_resolved?: boolean;
  assigned_to?: string | null;
  reply?: string | null;
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string | null;
  user_name?: string;
  module?: string;
  action?: string;
  subject_type?: string | null;
  subject_id?: string | null;
  description?: string;
  ip_address?: string | null;
  created_at?: string;
}

export interface AdminNotification {
  id: string;
  type?: string;
  title: string;
  message?: string;
  is_read?: boolean;
  data?: any;
  created_at?: string;
}

export interface Setting {
  key: string;
  value: string | number | boolean | any;
  type?: string;
  description?: string | null;
  updated_at?: string;
}

export interface DashboardStats {
  total_sellers?: number;
  pending_sellers?: number;
  approved_sellers?: number;
  total_buyers?: number;
  approved_buyers?: number;
  total_products?: number;
  published_products?: number;
  pending_products?: number;
  pending_requirements?: number;
  pending_orders?: number;
  total_orders?: number;
  total_revenue?: number;
  total_rfqs?: number;
  new_rfqs?: number;
  pending_rfqs?: number;
  quoted_rfqs?: number;
  closed_rfqs?: number;
  rejected_rfqs?: number;
  recent_activity?: Array<{
    id?: string;
    type?: string;
    title?: string;
    message?: string;
    created_at?: string;
    action?: string;
    details?: string;
    user_name?: string;
  }>;
  monthly_chart?: Array<{
    month?: string;
    product_count?: number;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  status_code?: number;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from?: number | null;
  to?: number | null;
  has_more?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
}

export interface AdminAuth {
  authenticated: boolean;
  user?: User | null;
  remember_token?: string | null;
}
