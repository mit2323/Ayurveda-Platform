"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronDown, Eye, Package } from "lucide-react";
import apiClient from "@/lib/axios";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#FFF8E1", color: "#F59E0B" },
  confirmed: { bg: "#E8F5E9", color: "#4CAF50" },
  processing: { bg: "#E8F0FF", color: "#3B5BDB" },
  shipped: { bg: "#E0F7FA", color: "#0097A7" },
  delivered: { bg: "#E8F5E9", color: "#2E7D32" },
  cancelled: { bg: "#FFEBEE", color: "#C62828" },
  refunded: { bg: "#F3E5F5", color: "#6A1B9A" },
};

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  user_id: number;
  shipping_address: { full_name: string; phone: string; city: string; };
  items: { product_snapshot: { name: string }; quantity: number; unit_price: number; }[];
  payment: { status: string; payment_method: string; } | null;
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState("");

  const updateStatus = useMutation({
    mutationFn: () => apiClient.patch(`/admin/orders/${order.id}/status`, null, {
      params: { new_status: status, tracking_number: tracking || undefined },
    }),
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.2)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]">
          <h2 className="font-display text-xl">Order #{order.order_number}</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">x</button>
        </div>
        <div className="p-6 space-y-5">
          {/* Customer */}
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Customer</p>
            <p className="font-medium">{order.shipping_address.full_name}</p>
            <p className="text-sm text-[var(--text-muted)]">{order.shipping_address.phone} · {order.shipping_address.city}</p>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Items</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-[var(--border-light)]">
                <span>{item.product_snapshot.name} x{item.quantity}</span>
                <span className="font-medium">Rs.{(parseFloat(String(item.unit_price)) * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold mt-2 pt-1">
              <span>Total</span>
              <span>Rs.{parseFloat(String(order.total_amount)).toFixed(0)}</span>
            </div>
          </div>

          {/* Payment */}
          {order.payment && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Payment</p>
              <div className="flex gap-4 text-sm">
                <span className="capitalize">{order.payment.payment_method || "Online"}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.payment.status === "captured" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}>{order.payment.status}</span>
              </div>
            </div>
          )}

          {/* Update status */}
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Update Status</p>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-field mb-3">
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            {(status === "shipped" || status === "delivered") && (
              <input value={tracking} onChange={e => setTracking(e.target.value)}
                placeholder="Tracking number (optional)" className="input-field" />
            )}
          </div>

          <button onClick={() => updateStatus.mutate()}
            className="w-full py-2.5 text-sm font-medium text-white rounded-sm"
            style={{ background: "var(--sage-600)" }}>
            Update Order Status
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery<Order[]>({
    queryKey: ["admin-orders", statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: "20" });
      if (statusFilter) params.set("status", statusFilter);
      return (await apiClient.get(`/admin/orders?${params}`)).data;
    },
  });

  const orders = (data || []).filter(o =>
    !search || o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.shipping_address.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-[var(--text-primary)]">Orders</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{orders.length} orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order or customer..." className="input-field pl-9 w-64" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-44">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Order status quick filters */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: "", label: "All" }, ...ORDER_STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))].map(opt => (
          <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all"
            style={{
              background: statusFilter === opt.value ? "var(--sage-600)" : "#fff",
              color: statusFilter === opt.value ? "#fff" : "var(--text-secondary)",
              borderColor: statusFilter === opt.value ? "var(--sage-600)" : "var(--border)",
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-[var(--border-light)] overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: "var(--cream)" }}>
            <tr className="border-b border-[var(--border-light)]">
              {["Order", "Customer", "Date", "Items", "Total", "Payment", "Status", "Actions"].map(h => (
                <th key={h} className="text-left text-xs uppercase tracking-wider text-[var(--text-muted)] px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border-light)]">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map(order => {
                const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                return (
                  <tr key={order.id} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--cream)] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[var(--sage-700)]">
                      #{order.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{order.shipping_address.full_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{order.shipping_address.city}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{order.items.length} items</td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                      Rs.{parseFloat(String(order.total_amount)).toFixed(0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${order.payment?.status === "captured" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        }`}>
                        {order.payment?.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full capitalize"
                        style={{ background: sc.bg, color: sc.color }}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-1 text-xs text-[var(--sage-600)] hover:underline">
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}