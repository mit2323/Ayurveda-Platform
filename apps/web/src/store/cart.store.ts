import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import toast from "react-hot-toast";

interface CartState {
    items: CartItem[];
    isOpen: boolean;
  _hydrated: boolean;
  setHydrated: () => void;

    addItem: (item: CartItem) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    closeCart: () => void;

    // Computed
    itemCount: () => number;
    subtotal: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (newItem) => {
                set((state) => {
                    const existing = state.items.find((i) => i.product_id === newItem.product_id);
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                i.product_id === newItem.product_id
                                    ? { ...i, quantity: i.quantity + newItem.quantity }
                                    : i
                            ),
                        };
                    }
                    return { items: [...state.items, newItem] };
                });
                toast.success(`${newItem.name} added to cart`, {
                    icon: "🌿",
                    duration: 2000,
                });
                set({ isOpen: true });
            },

            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter((i) => i.product_id !== productId),
                }));
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }
                set((state) => ({
                    items: state.items.map((i) =>
                        i.product_id === productId ? { ...i, quantity } : i
                    ),
                }));
            },

            clearCart: () => set({ items: [] }),
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            closeCart: () => set({ isOpen: false }),

            itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: () =>
                get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        }),
        {
            name: "ayurveda-cart",
            partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => { if (state) state.setHydrated(); },
        }
    )
);