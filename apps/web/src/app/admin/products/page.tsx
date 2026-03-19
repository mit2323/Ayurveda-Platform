"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight, X } from "lucide-react";
import apiClient from "@/lib/axios";
import toast from "react-hot-toast";

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  sale_price: number | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  dosha_type: string;
  category: { name: string } | null;
  primary_image_url: string | null;
}

const DOSHA_OPTIONS = ["none", "vata", "pitta", "kapha", "tridosha"];

function ProductModal({ product, onClose, onSaved }: {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    price: String(product?.price || ""),
    sale_price: String(product?.sale_price || ""),
    stock: String(product?.stock || "0"),
    dosha_type: product?.dosha_type || "none",
    short_description: "",
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        stock: parseInt(form.stock),
      };
      if (isEdit) {
        await apiClient.patch(`/products/${product!.id}`, payload);
        toast.success("Product updated");
      } else {
        await apiClient.post("/products", payload);
        toast.success("Product created");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.2)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]">
          <h2 className="font-display text-xl font-medium">{isEdit ? "Edit Product" : "Add New Product"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--cream)] rounded transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Product Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                required placeholder="e.g. Ashwagandha Root Powder" className="input-field" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">SKU *</label>
              <input value={form.sku} onChange={e => set("sku", e.target.value)}
                required placeholder="AWG-001" className="input-field font-mono" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Dosha Type</label>
              <select value={form.dosha_type} onChange={e => set("dosha_type", e.target.value)} className="input-field">
                {DOSHA_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Price (Rs.) *</label>
              <input value={form.price} onChange={e => set("price", e.target.value)}
                type="number" step="0.01" required placeholder="299.00" className="input-field" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Sale Price (Rs.)</label>
              <input value={form.sale_price} onChange={e => set("sale_price", e.target.value)}
                type="number" step="0.01" placeholder="Optional" className="input-field" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Stock *</label>
              <input value={form.stock} onChange={e => set("stock", e.target.value)}
                type="number" required placeholder="100" className="input-field" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Short Description</label>
              <input value={form.short_description} onChange={e => set("short_description", e.target.value)}
                placeholder="Brief product description" className="input-field" />
            </div>
          </div>

          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)}
                className="w-4 h-4 accent-[var(--sage-600)]" />
              <span className="text-sm text-[var(--text-secondary)]">Active (visible to customers)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)}
                className="w-4 h-4 accent-[var(--gold-500)]" />
              <span className="text-sm text-[var(--text-secondary)]">Featured</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-medium text-white rounded-sm"
              style={{ background: "var(--sage-600)" }}>
              {loading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
            </button>
            <button type="button" onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium border rounded-sm"
              style={{ borderColor: "var(--border)" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });

  const { data, isLoading } = useQuery<{ items: Product[] }>({
    queryKey: ["admin-products", search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", page_size: "50" });
      if (search) params.set("q", search);
      return (await apiClient.get(`/products?${params}`)).data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (p: Product) => apiClient.patch(`/products/${p.id}`, { is_active: !p.is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deactivated");
    },
  });

  const products = data?.items || [];

  return (
    <div className="space-y-5">
      {modal.open && (
        <ProductModal
          product={modal.product}
          onClose={() => setModal({ open: false, product: null })}
          onSaved={() => { setModal({ open: false, product: null }); qc.invalidateQueries({ queryKey: ["admin-products"] }); }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-[var(--text-primary)]">Products</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{products.length} products</p>
        </div>
        <button onClick={() => setModal({ open: true, product: null })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-sm"
          style={{ background: "var(--sage-600)" }}>
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search products..." className="input-field pl-9" />
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-[var(--border-light)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: "var(--cream)" }}>
              <tr className="border-b border-[var(--border-light)]">
                {["Product", "SKU", "Dosha", "Price", "Stock", "Status", "Actions"].map(h => (
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">
                    No products found. Add your first product!
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--cream)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">{p.name}</p>
                      {p.is_featured && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
                          style={{ background: "#FFF8E1", color: "#B8891E" }}>Featured</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{p.sku}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize px-2 py-0.5 rounded-sm"
                        style={{ background: "var(--sage-100)", color: "var(--sage-700)" }}>
                        {p.dosha_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      Rs.{parseFloat(String(p.price)).toFixed(0)}
                      {p.sale_price && (
                        <span className="ml-1 text-xs text-[var(--text-muted)] line-through">
                          Rs.{parseFloat(String(p.sale_price)).toFixed(0)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${p.stock <= 10 ? "text-red-600" : "text-[var(--text-primary)]"}`}>
                        {p.stock}
                      </span>
                      {p.stock <= 10 && <span className="ml-1 text-[10px] text-red-500">Low</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive.mutate(p)}
                        className="flex items-center gap-1 text-xs">
                        {p.is_active
                          ? <ToggleRight size={18} color="var(--sage-600)" />
                          : <ToggleLeft size={18} color="var(--text-muted)" />}
                        <span className={p.is_active ? "text-[var(--sage-600)]" : "text-[var(--text-muted)]"}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal({ open: true, product: p })}
                          className="p-1.5 hover:bg-[var(--sage-100)] rounded transition-colors text-[var(--text-muted)] hover:text-[var(--sage-700)]">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => {
                          if (confirm("Deactivate this product?")) deleteProduct.mutate(p.id);
                        }} className="p-1.5 hover:bg-red-50 rounded transition-colors text-[var(--text-muted)] hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}