"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, Package } from "lucide-react";
import apiClient from "@/lib/axios";
import toast from "react-hot-toast";

interface Product {
    id: number;
    name: string;
    sku: string;
    stock: number;
    low_stock_threshold: number;
    is_active: boolean;
    price: number;
}

function RestockModal({ product, onClose, onDone }: { product: Product; onClose: () => void; onDone: () => void }) {
    const [qty, setQty] = useState("50");
    const [loading, setLoading] = useState(false);

    const handleRestock = async () => {
        setLoading(true);
        try {
            await apiClient.patch(`/admin/inventory/${product.id}/restock`, null, { params: { quantity: parseInt(qty) } });
            toast.success(`Added ${qty} units to ${product.name}`);
            onDone();
        } catch {
            toast.error("Failed to update stock");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-sm w-full max-w-sm p-6" style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.2)" }}>
                <h2 className="font-display text-xl mb-1">Restock Product</h2>
                <p className="text-sm text-[var(--text-muted)] mb-5">{product.name}</p>
                <div className="mb-4">
                    <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">
                        Current Stock: <strong>{product.stock}</strong>
                    </label>
                    <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Add Units</label>
                    <input type="number" value={qty} onChange={e => setQty(e.target.value)}
                        min="1" className="input-field" placeholder="50" />
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        New stock will be: <strong>{product.stock + (parseInt(qty) || 0)}</strong>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleRestock} disabled={loading}
                        className="flex-1 py-2.5 text-sm font-medium text-white rounded-sm"
                        style={{ background: "var(--sage-600)" }}>
                        {loading ? "Updating..." : "Confirm Restock"}
                    </button>
                    <button onClick={onClose}
                        className="px-5 py-2.5 text-sm border rounded-sm" style={{ borderColor: "var(--border)" }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminInventoryPage() {
    const qc = useQueryClient();
    const [restockProduct, setRestockProduct] = useState<Product | null>(null);
    const [showLowOnly, setShowLowOnly] = useState(false);

    const { data: products = [], isLoading } = useQuery<Product[]>({
        queryKey: ["admin-inventory"],
        queryFn: async () => (await apiClient.get("/products?page=1&page_size=100")).data.items,
        refetchInterval: 60000,
    });

    const { data: lowStock = [] } = useQuery<Product[]>({
        queryKey: ["admin-low-stock"],
        queryFn: async () => (await apiClient.get("/admin/inventory/low-stock")).data,
    });

    const displayed = showLowOnly ? lowStock : products;

    const getStockStatus = (p: Product) => {
        if (p.stock === 0) return { label: "Out of Stock", color: "#C62828", bg: "#FFEBEE" };
        if (p.stock <= p.low_stock_threshold) return { label: "Low Stock", color: "#F59E0B", bg: "#FFF8E1" };
        return { label: "In Stock", color: "#2E7D32", bg: "#E8F5E9" };
    };

    const stockHealth = products.length ? Math.round(
        (products.filter(p => p.stock > p.low_stock_threshold).length / products.length) * 100
    ) : 0;

    return (
        <div className="space-y-5">
            {restockProduct && (
                <RestockModal
                    product={restockProduct}
                    onClose={() => setRestockProduct(null)}
                    onDone={() => {
                        setRestockProduct(null);
                        qc.invalidateQueries({ queryKey: ["admin-inventory"] });
                        qc.invalidateQueries({ queryKey: ["admin-low-stock"] });
                    }}
                />
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-medium text-[var(--text-primary)]">Inventory</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">{products.length} products tracked</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Products", value: products.length, color: "var(--sage-600)", bg: "var(--sage-50)" },
                    { label: "In Stock", value: products.filter(p => p.stock > p.low_stock_threshold).length, color: "#2E7D32", bg: "#E8F5E9" },
                    { label: "Low Stock", value: lowStock.length, color: "#F59E0B", bg: "#FFF8E1" },
                    { label: "Out of Stock", value: products.filter(p => p.stock === 0).length, color: "#C62828", bg: "#FFEBEE" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded border border-[var(--border-light)] p-4">
                        <p className="font-display text-2xl font-medium" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wide">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Stock health bar */}
            <div className="bg-white rounded border border-[var(--border-light)] p-5">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Stock Health</p>
                    <p className="text-sm font-semibold text-[var(--sage-700)]">{stockHealth}%</p>
                </div>
                <div className="h-2 rounded-full" style={{ background: "var(--cream-dark)" }}>
                    <div className="h-2 rounded-full transition-all" style={{
                        width: stockHealth + "%",
                        background: stockHealth > 70 ? "var(--sage-500)" : stockHealth > 40 ? "#F59E0B" : "#C62828"
                    }} />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{stockHealth}% of products adequately stocked</p>
            </div>

            {/* Low stock alert */}
            {lowStock.length > 0 && (
                <div className="flex items-start gap-3 px-4 py-3 rounded"
                    style={{ background: "#FFF8E1", border: "1px solid #FFE082" }}>
                    <AlertTriangle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-900">{lowStock.length} products need restocking</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            {lowStock.slice(0, 3).map(p => p.name).join(", ")}
                            {lowStock.length > 3 && ` and ${lowStock.length - 3} more`}
                        </p>
                    </div>
                </div>
            )}

            {/* Filter toggle */}
            <div className="flex gap-2">
                <button onClick={() => setShowLowOnly(false)}
                    className="px-4 py-1.5 text-xs font-medium rounded-full border transition-all"
                    style={{
                        background: !showLowOnly ? "var(--sage-600)" : "#fff",
                        color: !showLowOnly ? "#fff" : "var(--text-secondary)",
                        borderColor: !showLowOnly ? "var(--sage-600)" : "var(--border)",
                    }}>All Products</button>
                <button onClick={() => setShowLowOnly(true)}
                    className="px-4 py-1.5 text-xs font-medium rounded-full border transition-all"
                    style={{
                        background: showLowOnly ? "#F59E0B" : "#fff",
                        color: showLowOnly ? "#fff" : "var(--text-secondary)",
                        borderColor: showLowOnly ? "#F59E0B" : "var(--border)",
                    }}>
                    Low Stock Only {lowStock.length > 0 && `(${lowStock.length})`}
                </button>
            </div>

            {/* Inventory table */}
            <div className="bg-white rounded border border-[var(--border-light)] overflow-hidden">
                <table className="w-full text-sm">
                    <thead style={{ background: "var(--cream)" }}>
                        <tr className="border-b border-[var(--border-light)]">
                            {["Product", "SKU", "Price", "Current Stock", "Threshold", "Status", "Action"].map(h => (
                                <th key={h} className="text-left text-xs uppercase tracking-wider text-[var(--text-muted)] px-4 py-3">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-[var(--border-light)]">
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : displayed.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">
                                    {showLowOnly ? "No low stock items!" : "No products found."}
                                </td>
                            </tr>
                        ) : (
                            displayed.map(p => {
                                const status = getStockStatus(p);
                                return (
                                    <tr key={p.id} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--cream)] transition-colors">
                                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{p.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{p.sku}</td>
                                        <td className="px-4 py-3">Rs.{parseFloat(String(p.price)).toFixed(0)}</td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-lg" style={{ color: status.color }}>{p.stock}</span>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text-muted)]">{p.low_stock_threshold}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-medium px-2 py-1 rounded-full"
                                                style={{ background: status.bg, color: status.color }}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => setRestockProduct(p)}
                                                className="flex items-center gap-1.5 text-xs font-medium text-[var(--sage-600)] hover:text-[var(--sage-800)] transition-colors">
                                                <Plus size={13} />
                                                Restock
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