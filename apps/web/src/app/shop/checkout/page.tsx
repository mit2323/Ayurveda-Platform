"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import ShopLayout from "@/components/layouts/ShopLayout";
import Link from "next/link";
import apiClient from "@/lib/axios";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import {
  ShoppingBag, MapPin, Plus, Tag,
  ChevronRight, Shield, Truck, RotateCcw, Check,
} from "lucide-react";

const MockPaymentModal = dynamic(() => import("@/components/shop/MockPaymentModal"), { ssr: false });

interface Address {
  id: number; label: string; full_name: string; phone: string;
  line1: string; line2?: string; city: string; state: string;
  pincode: string; country: string; is_default: boolean;
}

function AddAddressModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    label: "Home", full_name: "", phone: "", line1: "",
    line2: "", city: "", state: "", pincode: "", is_default: false,
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const params: any = {
        label: form.label, full_name: form.full_name, phone: form.phone,
        line1: form.line1, city: form.city, state: form.state,
        pincode: form.pincode, is_default: form.is_default,
      };
      if (form.line2) params.line2 = form.line2;
      await apiClient.post("/users/me/addresses", null, { params });
      toast.success("Address saved!");
      onAdded();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save address");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.2)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]">
          <h2 className="font-display text-xl font-medium">Add Delivery Address</h2>
          <button onClick={onClose} className="text-2xl leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)]">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Label</label>
              <select value={form.label} onChange={e => set("label", e.target.value)} className="input-field">
                {["Home", "Work", "Other"].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Full Name *</label>
              <input required value={form.full_name} onChange={e => set("full_name", e.target.value)} className="input-field" placeholder="Your full name" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Phone *</label>
              <input required value={form.phone} onChange={e => set("phone", e.target.value)} className="input-field" placeholder="10-digit mobile" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Pincode *</label>
              <input required value={form.pincode} onChange={e => set("pincode", e.target.value)} className="input-field" placeholder="400001" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Address Line 1 *</label>
              <input required value={form.line1} onChange={e => set("line1", e.target.value)} className="input-field" placeholder="Flat / House No, Street" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Address Line 2</label>
              <input value={form.line2} onChange={e => set("line2", e.target.value)} className="input-field" placeholder="Landmark, Area (optional)" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">City *</label>
              <input required value={form.city} onChange={e => set("city", e.target.value)} className="input-field" placeholder="Mumbai" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">State *</label>
              <input required value={form.state} onChange={e => set("state", e.target.value)} className="input-field" placeholder="Maharashtra" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_default} onChange={e => set("is_default", e.target.checked)} className="w-4 h-4 accent-[var(--sage-600)]" />
            <span className="text-sm text-[var(--text-secondary)]">Set as default address</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-3 text-sm font-medium text-white rounded-sm"
              style={{ background: "var(--sage-600)" }}>
              {loading ? "Saving..." : "Save Address"}
            </button>
            <button type="button" onClick={onClose}
              className="px-6 py-3 text-sm border rounded-sm" style={{ borderColor: "var(--border)" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart, _hydrated } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Wait for Zustand to rehydrate from localStorage
    setTimeout(() => setCartHydrated(true), 100);
  }, []);
  useEffect(() => { if (isAuthenticated) fetchAddresses(); }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      const res = await apiClient.get<Address[]>("/users/me/addresses");
      setAddresses(res.data);
      const def = res.data.find(a => a.is_default);
      if (def) setSelectedAddress(def.id);
      else if (res.data.length > 0) setSelectedAddress(res.data[0].id);
    } catch { }
  };

  const total = subtotal();
  const shipping = total >= 500 ? 0 : 50;
  const tax = Math.round((total - couponDiscount) * 0.18);
  const grandTotal = total - couponDiscount + shipping + tax;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setLoadingCoupon(true);
    try {
      const res = await apiClient.post("/orders/apply-coupon", {
        code: couponCode, order_amount: total,
      });
      setCouponDiscount(parseFloat(String(res.data.discount_amount)));
      setCouponApplied(true);
      toast.success("Coupon applied! Saved Rs." + parseFloat(String(res.data.discount_amount)).toFixed(0));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Invalid coupon code");
    } finally { setLoadingCoupon(false); }
  };

  const handleProceedToPayment = async () => {
    if (!selectedAddress) { toast.error("Please select a delivery address"); return; }
    setCreatingOrder(true);
    try {
      // Sync each cart item to Redis backend first
      for (const item of items) {
        await apiClient.post("/cart/items", {
          product_id: item.product_id,
          quantity: item.quantity,
        });
      }

      // Now create the order
      const orderRes = await apiClient.post("/orders", {
        address_id: selectedAddress,
        coupon_code: couponApplied ? couponCode : null,
      });
      setCurrentOrderId(orderRes.data.id);
      setCurrentOrderNumber(orderRes.data.order_number);
      setShowPayment(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to create order. Please try again.");
      console.error(err.response?.data);
    } finally { setCreatingOrder(false); }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    setShowPayment(false);
    try {
      // Mark order as confirmed with mock payment
      await apiClient.post("/payments/verify", {
        razorpay_order_id: "mock_" + currentOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: "mock_signature",
        order_id: currentOrderId,
      }).catch(() => {
        // Mock verification may fail - that is OK for demo
      });
    } catch { }
    clearCart();
    setOrderPlaced(true);
    setPlacedOrderNumber(currentOrderNumber);
    toast.success("Order placed successfully!");
  };

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <ShopLayout>
        <div className="container-main py-20 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--sage-100)" }}>
            <ShoppingBag size={28} color="var(--sage-600)" />
          </div>
          <h2 className="font-display text-3xl text-[var(--text-primary)] mb-3">Sign in to checkout</h2>
          <p className="text-[var(--text-muted)] mb-8">Please sign in to place your order.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/login" className="btn-primary">Sign In</Link>
            <Link href="/auth/register" className="btn-outline">Create Account</Link>
          </div>
        </div>
      </ShopLayout>
    );
  }

  if (mounted && cartHydrated && items.length === 0 && !orderPlaced) {
    return (
      <ShopLayout>
        <div className="container-main py-20 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--cream-dark)" }}>
            <ShoppingBag size={28} color="var(--text-muted)" />
          </div>
          <h2 className="font-display text-3xl text-[var(--text-primary)] mb-3">Your cart is empty</h2>
          <Link href="/shop/products" className="btn-primary">Continue Shopping</Link>
        </div>
      </ShopLayout>
    );
  }

  if (orderPlaced) {
    return (
      <ShopLayout>
        <div className="container-main py-20 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "#E8F5E9" }}>
            <Check size={36} color="#2E7D32" />
          </div>
          <h2 className="font-display text-4xl text-[var(--text-primary)] mb-3">Order Placed!</h2>
          <p className="text-[var(--text-muted)] mb-2">Thank you for your order, {user?.full_name?.split(" ")[0]}!</p>
          <p className="text-sm font-medium text-[var(--sage-700)] mb-8 font-mono">#{placedOrderNumber}</p>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            A confirmation email will be sent shortly. Track your order from your account.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/shop/orders" className="btn-primary">Track Orders</Link>
            <Link href="/shop/products" className="btn-outline">Continue Shopping</Link>
          </div>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      {showAddModal && (
        <AddAddressModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); fetchAddresses(); }}
        />
      )}

      {showPayment && (
        <MockPaymentModal
          amount={grandTotal}
          orderNumber={currentOrderNumber}
          onSuccess={handlePaymentSuccess}
          onDismiss={() => setShowPayment(false)}
        />
      )}

      <div className="container-main py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-8">
          <Link href="/shop/products" className="hover:text-[var(--sage-600)] transition-colors">Shop</Link>
          <ChevronRight size={14} />
          <Link href="/shop/cart" className="hover:text-[var(--sage-600)] transition-colors">Cart</Link>
          <ChevronRight size={14} />
          <span className="text-[var(--text-primary)] font-medium">Checkout</span>
        </div>

        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left */}
          <div className="lg:col-span-3 space-y-6">

            {/* Address */}
            <div className="bg-white rounded border border-[var(--border-light)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]"
                style={{ background: "var(--cream)" }}>
                <div className="flex items-center gap-2">
                  <MapPin size={16} color="var(--sage-600)" />
                  <h2 className="font-semibold text-[var(--text-primary)]">Delivery Address</h2>
                </div>
                <button onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 text-xs font-medium text-[var(--sage-600)] hover:text-[var(--sage-800)] transition-colors">
                  <Plus size={13} /> Add New
                </button>
              </div>
              <div className="p-5">
                {addresses.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-[var(--text-muted)] mb-4">No saved addresses yet.</p>
                    <button onClick={() => setShowAddModal(true)} className="btn-outline text-sm px-6 py-2">
                      Add Delivery Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map(addr => (
                      <label key={addr.id}
                        className="flex items-start gap-3 p-4 rounded border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: selectedAddress === addr.id ? "var(--sage-500)" : "var(--border-light)",
                          background: selectedAddress === addr.id ? "var(--sage-50)" : "#fff",
                        }}>
                        <input type="radio" name="address" checked={selectedAddress === addr.id}
                          onChange={() => setSelectedAddress(addr.id)} className="mt-1 accent-[var(--sage-600)]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-sm uppercase"
                              style={{ background: "var(--sage-100)", color: "var(--sage-700)" }}>
                              {addr.label}
                            </span>
                            {addr.is_default && <span className="text-xs text-[var(--sage-600)]">Default</span>}
                          </div>
                          <p className="font-medium text-sm text-[var(--text-primary)]">{addr.full_name}</p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {addr.line1}{addr.line2 ? ", " + addr.line2 : ""}
                          </p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-sm text-[var(--text-muted)] mt-0.5">{addr.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-white rounded border border-[var(--border-light)] overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border-light)]"
                style={{ background: "var(--cream)" }}>
                <Shield size={16} color="var(--sage-600)" />
                <h2 className="font-semibold text-[var(--text-primary)]">Payment Method</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 p-4 rounded border-2"
                  style={{ borderColor: "var(--sage-300)", background: "var(--sage-50)" }}>
                  <div className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                    style={{ background: "var(--sage-600)" }}>
                    <Shield size={18} color="#fff" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-[var(--text-primary)]">Secure Checkout</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Cards, UPI, Net Banking, Wallets accepted
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {["UPI", "Card", "NB"].map(m => (
                      <span key={m} className="text-[10px] font-medium px-1.5 py-0.5 rounded border"
                        style={{ borderColor: "var(--sage-300)", color: "var(--sage-700)", background: "#fff" }}>{m}</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-3 flex items-center gap-1.5">
                  <Shield size={11} />
                  Your payment is processed securely. We never store card details.
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: "Secure Payment", sub: "256-bit SSL" },
                { icon: Truck, label: "Free Shipping", sub: "Above Rs.500" },
                { icon: RotateCcw, label: "Easy Returns", sub: "7-day policy" },
              ].map(b => (
                <div key={b.label} className="flex items-start gap-2 p-3 bg-white rounded border border-[var(--border-light)]">
                  <b.icon size={14} color="var(--sage-600)" className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-[var(--text-primary)]">{b.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded border border-[var(--border-light)] sticky top-24">
              <div className="px-5 py-4 border-b border-[var(--border-light)]" style={{ background: "var(--cream)" }}>
                <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <ShoppingBag size={16} color="var(--sage-600)" />
                  Order Summary ({items.length} {items.length === 1 ? "item" : "items"})
                </h2>
              </div>
              <div className="p-5">
                {/* Items */}
                <div className="space-y-3 mb-5 max-h-52 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div key={item.product_id} className="flex gap-3">
                      <div className="w-12 h-12 rounded shrink-0 overflow-hidden"
                        style={{ background: "var(--cream-dark)" }}>
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">🌿</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">
                        Rs.{(parseFloat(String(item.price)) * item.quantity).toFixed(0)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="mb-5 pb-5 border-b border-[var(--border-light)]">
                  {couponApplied ? (
                    <div className="flex items-center justify-between p-3 rounded"
                      style={{ background: "#E8F5E9", border: "1px solid #A5D6A7" }}>
                      <div className="flex items-center gap-2">
                        <Tag size={13} color="#2E7D32" />
                        <span className="text-sm font-medium text-green-800">{couponCode}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-green-700">
                          -Rs.{couponDiscount.toFixed(0)}
                        </span>
                        <button onClick={() => { setCouponApplied(false); setCouponCode(""); setCouponDiscount(0); }}
                          className="text-xs text-green-600 hover:text-green-800">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={e => e.key === "Enter" && applyCoupon()}
                          placeholder="Coupon code" className="input-field pl-8 text-sm uppercase" />
                      </div>
                      <button onClick={applyCoupon} disabled={loadingCoupon || !couponCode.trim()}
                        className="px-4 text-sm font-medium text-white rounded-sm disabled:opacity-50"
                        style={{ background: "var(--sage-600)" }}>
                        {loadingCoupon ? "..." : "Apply"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Subtotal</span>
                    <span>Rs.{total.toFixed(0)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Discount</span>
                      <span>-Rs.{couponDiscount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Shipping</span>
                    <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                      {shipping === 0 ? "FREE" : "Rs." + shipping}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">GST (18%)</span>
                    <span>Rs.{tax}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-3 border-t border-[var(--border)]">
                    <span>Total Payable</span>
                    <span className="text-[var(--sage-700)]">Rs.{grandTotal.toFixed(0)}</span>
                  </div>
                </div>

                {/* CTA */}
                <button onClick={handleProceedToPayment}
                  disabled={creatingOrder || !selectedAddress || items.length === 0}
                  className="w-full py-4 font-semibold text-white rounded-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, var(--sage-600), var(--sage-700))",
                    boxShadow: "0 4px 20px rgba(78,112,64,0.3)",
                  }}>
                  {creatingOrder ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Preparing order...
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      Pay Rs.{grandTotal.toFixed(0)} Securely
                    </>
                  )}
                </button>

                {!selectedAddress && addresses.length > 0 && (
                  <p className="text-xs text-center text-amber-600 mt-2">Select a delivery address to continue</p>
                )}
                {addresses.length === 0 && (
                  <p className="text-xs text-center text-amber-600 mt-2">Add a delivery address to continue</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}