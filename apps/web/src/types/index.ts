// ── User ──────────────────────────────────────────────────────────────────────
export type UserRole = "customer" | "admin" | "superadmin";

export interface User {
    id: number;
    email: string;
    full_name: string;
    phone: string | null;
    role: UserRole;
    is_verified: boolean;
    avatar_url: string | null;
}

export interface TokenPair {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
}

// ── Product ───────────────────────────────────────────────────────────────────
export type DoshaType = "vata" | "pitta" | "kapha" | "tridosha" | "none";

export interface Category {
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
}

export interface ProductImage {
    id: number;
    url: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    sale_price: number | null;
    stock: number;
    is_active: boolean;
    is_featured: boolean;
    dosha_type: DoshaType;
    primary_image_url: string | null;
    category: Category | null;
    average_rating: number | null;
    review_count: number;
}

export interface ProductDetail extends Product {
    sku: string;
    description: string | null;
    short_description: string | null;
    ingredients: Ingredient[] | null;
    benefits: string[] | null;
    usage_instructions: string | null;
    certifications: string[] | null;
    weight_grams: number | null;
    meta_title: string | null;
    meta_description: string | null;
    images: ProductImage[];
}

export interface Ingredient {
    name: string;
    quantity: string;
}

// ── Cart ──────────────────────────────────────────────────────────────────────
export interface CartItem {
    product_id: number;
    quantity: number;
    name: string;
    price: number;
    image_url: string | null;
    slug: string;
}

export interface CartSummary {
    items: CartItem[];
    subtotal: number;
    item_count: number;
}

// ── Order ─────────────────────────────────────────────────────────────────────
export type OrderStatus =
    | "pending" | "confirmed" | "processing"
    | "shipped" | "delivered" | "cancelled" | "refunded";

export type PaymentStatus =
    | "pending" | "captured" | "failed" | "refunded" | "partially_refunded";

export interface OrderItem {
    id: number;
    product_id: number | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_snapshot: {
        name: string;
        sku: string;
        image_url: string | null;
        slug: string;
    };
}

export interface Payment {
    id: number;
    razorpay_order_id: string;
    razorpay_payment_id: string | null;
    amount: number;
    currency: string;
    status: PaymentStatus;
    payment_method: string | null;
}

export interface Order {
    id: number;
    order_number: string;
    status: OrderStatus;
    subtotal: number;
    discount_amount: number;
    shipping_amount: number;
    tax_amount: number;
    total_amount: number;
    coupon_code: string | null;
    shipping_address: ShippingAddress;
    tracking_number: string | null;
    items: OrderItem[];
    payment: Payment | null;
    created_at: string;
}

export interface ShippingAddress {
    full_name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
}

// ── Address ───────────────────────────────────────────────────────────────────
export interface Address {
    id: number;
    label: string;
    full_name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
    is_default: boolean;
}

// ── Review ────────────────────────────────────────────────────────────────────
export interface Review {
    id: number;
    product_id: number;
    rating: number;
    title: string | null;
    body: string | null;
    is_verified_purchase: boolean;
    user_full_name: string | null;
    created_at: string;
}

// ── API ───────────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface APIError {
    detail: string | { msg: string; type: string }[];
}

// ── Razorpay ──────────────────────────────────────────────────────────────────
export interface RazorpayOrderResponse {
    razorpay_order_id: string;
    amount: number;
    currency: string;
    order_id: number;
    key_id: string;
}