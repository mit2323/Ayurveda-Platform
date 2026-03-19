"use client";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useMounted } from "@/hooks/useMounted";
export default function CartSidebar() {
    const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCartStore();
    const total = subtotal();
    const mounted = useMounted();
    if (!mounted) return null;
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                    onClick={closeCart}
                />
            )}

            {/* Drawer */}
            <div
                className="fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col transition-transform duration-300 ease-out"
                style={{
                    background: "var(--cream)",
                    boxShadow: "-8px 0 40px rgba(90,60,30,0.15)",
                    transform: isOpen ? "translateX(0)" : "translateX(100%)",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: "var(--border)" }}
                >
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={18} color="var(--sage-600)" />
                        <h2 className="font-display text-lg font-medium text-[var(--text-primary)]">
                            Your Cart
                        </h2>
                        {items.length > 0 && (
                            <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{ background: "var(--sage-100)", color: "var(--sage-700)" }}
                            >
                                {items.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={closeCart}
                        className="p-1.5 rounded-full hover:bg-[var(--cream-dark)] transition-colors"
                    >
                        <X size={18} color="var(--text-secondary)" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ background: "var(--cream-dark)" }}
                            >
                                <ShoppingBag size={24} color="var(--text-muted)" />
                            </div>
                            <div>
                                <p className="font-medium text-[var(--text-primary)] mb-1">Your cart is empty</p>
                                <p className="text-sm text-[var(--text-muted)]">Add some Ayurvedic goodness</p>
                            </div>
                            <button onClick={closeCart} className="btn-outline mt-4">
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.product_id}
                                    className="flex gap-3 pb-4 border-b"
                                    style={{ borderColor: "var(--border-light)" }}
                                >
                                    {/* Image */}
                                    <div
                                        className="w-16 h-16 rounded shrink-0 overflow-hidden"
                                        style={{ background: "var(--cream-dark)" }}
                                    >
                                        {item.image_url ? (
                                            <Image
                                                src={item.image_url}
                                                alt={item.name}
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-lg">🌿</div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/shop/products/${item.slug}`}
                                            className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 hover:text-[var(--sage-600)] transition-colors"
                                            onClick={closeCart}
                                        >
                                            {item.name}
                                        </Link>
                                        <p className="text-sm font-semibold text-[var(--sage-600)] mt-1">
                                            ₹{item.price.toFixed(0)}
                                        </p>

                                        {/* Quantity controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                className="w-6 h-6 rounded border flex items-center justify-center hover:bg-[var(--cream-dark)] transition-colors"
                                                style={{ borderColor: "var(--border)" }}
                                            >
                                                <Minus size={10} />
                                            </button>
                                            <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                className="w-6 h-6 rounded border flex items-center justify-center hover:bg-[var(--cream-dark)] transition-colors"
                                                style={{ borderColor: "var(--border)" }}
                                            >
                                                <Plus size={10} />
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.product_id)}
                                                className="ml-2 text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    {/* Line total */}
                                    <div className="text-sm font-semibold text-[var(--text-primary)] shrink-0">
                                        ₹{(item.price * item.quantity).toFixed(0)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div
                        className="px-6 py-5 border-t space-y-4"
                        style={{ borderColor: "var(--border)", background: "#fff" }}
                    >
                        {/* Free shipping notice */}
                        {total < 500 && (
                            <div
                                className="text-xs text-center py-2 rounded"
                                style={{ background: "var(--sage-50)", color: "var(--sage-700)" }}
                            >
                                Add ₹{(500 - total).toFixed(0)} more for free shipping 🚚
                            </div>
                        )}

                        {/* Subtotal */}
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-[var(--text-secondary)]">Subtotal</span>
                            <span className="font-semibold text-[var(--text-primary)]">₹{total.toFixed(0)}</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">Taxes and shipping calculated at checkout</p>

                        <Link
                            href="/shop/checkout"
                            className="btn-primary w-full justify-center"
                            onClick={closeCart}
                        >
                            Proceed to Checkout
                        </Link>
                        <button
                            onClick={closeCart}
                            className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}