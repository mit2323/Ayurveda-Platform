"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import apiClient from "@/lib/axios";
import ShopLayout from "@/components/layouts/ShopLayout";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

interface OrderItem {
  id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_snapshot: { name: string; sku: string; image_url: string | null; slug: string; };
}

interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  coupon_code: string | null;
  tracking_number: string | null;
  shipping_address: { full_name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; };
  items: OrderItem[];
  payment: { status: string; payment_method: string | null; } | null;
  created_at: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; step: number }> = {
  pending: { label: "Pending", color: "#F59E0B", bg: "#FFF8E1", step: 0 },
  confirmed: { label: "Confirmed", color: "#3B82F6", bg: "#EFF6FF", step: 1 },
  processing: { label: "Processing", color: "#8B5CF6", bg: "#F5F3FF", step: 2 },
  shipped: { label: "Shipped", color: "#06B6D4", bg: "#ECFEFF", step: 3 },
  delivered: { label: "Delivered", color: "#10B981", bg: "#ECFDF5", step: 4 },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2", step: -1 },
  refunded: { label: "Refunded", color: "#6B7280", bg: "#F9FAFB", step: -1 },
};

const STEPS = ["Confirmed", "Processing", "Shipped", "Delivered"];

function OrderProgress({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  if (cfg.step < 0) return null;
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = cfg.step > i;
        const active = cfg.step === i + 1;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: done || active ? "var(--sage-600)" : "var(--cream-dark)",
                  color: done || active ? "#fff" : "var(--text-muted)",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 mb-4 rounded"
                style={{ background: done ? "var(--sage-600)" : "var(--cream-dark)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const date = new Date(order.created_at).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-sm w-full max-w-xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.2)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]"
          style={{ background: "var(--cream)" }}
        >
          <div>
            <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
              Order #{order.order_number}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{date}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <button
              onClick={onClose}
              className="text-2xl leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {order.status !== "cancelled" && order.status !== "refunded" && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">Order Progress</p>
              <OrderProgress status={order.status} />
            </div>
          )}

          {order.tracking_number && (
            <div
              className="flex items-center gap-2 p-3 rounded text-sm"
              style={{ background: "var(--sage-50)", border: "1px solid var(--sage-200)" }}
            >
              <Package size={14} color="var(--sage-600)" />
              <span className="text-[var(--sage-700)]">
                Tracking: <strong>{order.tracking_number}</strong>
              </span>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">Items Ordered</p>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-3 pb-3 border-b border-[var(--border-light)] last:border-0"
                >
                  <div
                    className="w-14 h-14 rounded overflow-hidden shrink-0"
                    style={{ background: "var(--cream-dark)" }}
                  >
                    {item.product_snapshot.image_url ? (
                      <img
                        src={item.product_snapshot.image_url}
                        alt={item.product_snapshot.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🌿</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-[var(--text-primary)]">
                      {item.product_snapshot.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                      SKU: {item.product_snapshot.sku}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Rs.{parseFloat(String(item.total_price)).toFixed(0)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Rs.{parseFloat(String(item.unit_price)).toFixed(0)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Delivery Address</p>
              <div className="p-3 rounded border border-[var(--border-light)] text-sm">
                <p className="font-medium text-[var(--text-primary)]">{order.shipping_address.full_name}</p>
                <p className="text-[var(--text-secondary)] mt-1">{order.shipping_address.line1}</p>
                {order.shipping_address.line2 && (
                  <p className="text-[var(--text-secondary)]">{order.shipping_address.line2}</p>
                )}
                <p className="text-[var(--text-secondary)]">
                  {order.shipping_address.city}, {order.shipping_address.state} -{" "}
                  {order.shipping_address.pincode}
                </p>
                <p className="text-[var(--text-muted)] mt-1">{order.shipping_address.phone}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Price Breakdown</p>
              <div className="p-3 rounded border border-[var(--border-light)] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Subtotal</span>
                  <span>Rs.{parseFloat(String(order.subtotal)).toFixed(0)}</span>
                </div>
                {parseFloat(String(order.discount_amount)) > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>
                      Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
                    </span>
                    <span>-Rs.{parseFloat(String(order.discount_amount)).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Shipping</span>
                  <span>
                    {parseFloat(String(order.shipping_amount)) === 0
                      ? "FREE"
                      : "Rs." + parseFloat(String(order.shipping_amount)).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">GST</span>
                  <span>Rs.{parseFloat(String(order.tax_amount)).toFixed(0)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1.5 border-t border-[var(--border-light)]">
                  <span>Total Paid</span>
                  <span className="text-[var(--sage-700)]">
                    Rs.{parseFloat(String(order.total_amount)).toFixed(0)}
                  </span>
                </div>
                {order.payment && (
                  <div className="pt-1.5 border-t border-[var(--border-light)]">
                    <span
                      className={
                        "text-[10px] font-medium px-2 py-0.5 rounded-full " +
                        (order.payment.status === "captured"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700")
                      }
                    >
                      {order.payment.status === "captured" ? "Paid" : order.payment.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1 text-center">Close</button>
            {order.status === "delivered" && (
              <Link href="/shop/products" className="btn-primary flex-1 text-center">
                Buy Again
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const date = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div
      className="bg-white rounded border border-[var(--border-light)] overflow-hidden hover:border-[var(--sage-300)] transition-all cursor-pointer"
      style={{ boxShadow: "var(--shadow-soft)" }}
      onClick={onClick}
    >
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-light)]"
        style={{ background: "var(--cream)" }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Order</p>
            <p className="font-mono text-sm font-semibold text-[var(--sage-700)]">#{order.order_number}</p>
          </div>
          <div className="w-px h-7 bg-[var(--border)]" />
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Date</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{date}</p>
          </div>
          <div className="w-px h-7 bg-[var(--border)]" />
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Total</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Rs.{parseFloat(String(order.total_amount)).toFixed(0)}
            </p>
          </div>
          <div className="w-px h-7 bg-[var(--border)]" />
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Items</p>
            <p className="text-sm text-[var(--text-primary)]">{order.items.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          <ChevronRight size={16} color="var(--text-muted)" />
        </div>
      </div>

      <div className="p-5">
        <div className="flex gap-3 flex-wrap mb-4">
          {order.items.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-11 h-11 rounded overflow-hidden shrink-0"
                style={{ background: "var(--cream-dark)" }}
              >
                {item.product_snapshot.image_url ? (
                  <img
                    src={item.product_snapshot.image_url}
                    alt={item.product_snapshot.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm">🌿</div>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-1 max-w-[120px]">
                  {item.product_snapshot.name}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  x{item.quantity} — Rs.{parseFloat(String(item.unit_price)).toFixed(0)}
                </p>
              </div>
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="flex items-center">
              <span className="text-xs text-[var(--text-muted)] italic">
                +{order.items.length - 3} more items
              </span>
            </div>
          )}
        </div>

        {order.status !== "cancelled" && order.status !== "refunded" && (
          <div className="pt-4 border-t border-[var(--border-light)]">
            <OrderProgress status={order.status} />
          </div>
        )}

        {order.tracking_number && (
          <div
            className="flex items-center gap-2 mt-3 text-xs rounded px-3 py-2"
            style={{ background: "var(--sage-50)", color: "var(--sage-700)" }}
          >
            <Package size={12} />
            <span>Tracking: <strong>{order.tracking_number}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { setMounted(true); }, []);

  const { data: orders = [], isLoading, error, refetch } = useQuery<Order[]>({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const res = await apiClient.get("/orders?page=1&page_size=50");
      return res.data.items || res.data || [];
    },
    enabled: mounted && isAuthenticated,
    refetchInterval: 30000,
  });

  const filtered = statusFilter === "all"
    ? orders
    : orders.filter(o => o.status === statusFilter);

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <ShopLayout>
        <div className="container-main py-20 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--sage-100)" }}
          >
            <ShoppingBag size={28} color="var(--sage-600)" />
          </div>
          <h2 className="font-display text-3xl text-[var(--text-primary)] mb-3">
            Sign in to view your orders
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            Track your Ayurvedic purchases all in one place.
          </p>
          <Link href="/auth/login" className="btn-primary">Sign In</Link>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <div className="container-main py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-4xl text-[var(--text-primary)]">My Orders</h1>
          <Link href="/shop/products" className="btn-outline text-sm px-4 py-2">
            Continue Shopping
          </Link>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          {user?.email} — {orders.length} order{orders.length !== 1 ? "s" : ""}
        </p>

        {orders.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setStatusFilter("all")}
              className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all"
              style={{
                background: statusFilter === "all" ? "var(--sage-600)" : "#fff",
                color: statusFilter === "all" ? "#fff" : "var(--text-secondary)",
                borderColor: statusFilter === "all" ? "var(--sage-600)" : "var(--border)",
              }}
            >
              All ({orders.length})
            </button>
            {Object.entries(statusCounts).map(([s, count]) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all capitalize"
                style={{
                  background: statusFilter === s ? "var(--sage-600)" : "#fff",
                  color: statusFilter === s ? "#fff" : "var(--text-secondary)",
                  borderColor: statusFilter === s ? "var(--sage-600)" : "var(--border)",
                }}
              >
                {s} ({count})
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded border border-[var(--border-light)] p-5 space-y-3">
                <div className="skeleton h-4 w-48" />
                <div className="skeleton h-14 w-full" />
                <div className="skeleton h-3 w-32" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-[var(--text-muted)] mb-4">Failed to load orders.</p>
            <button onClick={() => refetch()} className="btn-outline">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "var(--cream-dark)" }}
            >
              <Package size={28} color="var(--text-muted)" />
            </div>
            <h2 className="font-display text-2xl text-[var(--text-primary)] mb-3">
              {statusFilter === "all" ? "No orders yet" : `No ${statusFilter} orders`}
            </h2>
            <p className="text-[var(--text-muted)] mb-8">
              {statusFilter === "all"
                ? "Your orders will appear here after your first purchase."
                : "Try a different filter."}
            </p>
            {statusFilter === "all" ? (
              <Link href="/shop/products" className="btn-primary">Start Shopping</Link>
            ) : (
              <button onClick={() => setStatusFilter("all")} className="btn-outline">
                View All Orders
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}