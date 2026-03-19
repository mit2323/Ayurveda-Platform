"use client";
import ShopLayout from "@/components/layouts/ShopLayout";
import Link from "next/link";
import { useCartStore } from "@/store/cart.store";

export default function CartPage() {
  const { items, subtotal } = useCartStore();
  const total = subtotal();

  return (
    <ShopLayout>
      <div className="container-main py-12">
        <h1 className="font-display text-4xl text-[var(--text-primary)] mb-8">Your Cart</h1>
        {items.length === 0 ? (
          <div className="bg-white rounded border border-[var(--border-light)] p-10 text-center">
            <p className="text-[var(--text-muted)] mb-4">Your cart is empty.</p>
            <Link href="/shop/products" className="btn-primary">Continue Shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.product_id} className="bg-white rounded border border-[var(--border-light)] p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">Rs.{(parseFloat(String(item.price)) * item.quantity).toFixed(0)}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded border border-[var(--border-light)] p-6 h-fit">
              <div className="flex justify-between mb-4">
                <span className="text-[var(--text-secondary)]">Subtotal</span>
                <span className="font-semibold">Rs.{total.toFixed(0)}</span>
              </div>
              <Link href="/shop/checkout" className="btn-primary w-full justify-center">Checkout</Link>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
