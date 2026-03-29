"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Upload, X, Plus, ArrowLeft, Save, Eye, EyeOff,
  Package, Tag, IndianRupee, Boxes, Leaf, Image as ImageIcon,
  GripVertical, Check, AlertCircle,
} from "lucide-react";
import apiClient from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Category { id: number; name: string; slug: string; }
interface Ingredient { name: string; quantity: string; }
interface ProductImage { file: File; preview: string; isPrimary: boolean; }

const DOSHA_OPTIONS = [
  { value: "none",     label: "None",      desc: "No specific dosha" },
  { value: "vata",     label: "Vata",      desc: "Air & Space — grounding" },
  { value: "pitta",    label: "Pitta",     desc: "Fire & Water — cooling" },
  { value: "kapha",    label: "Kapha",     desc: "Earth & Water — energising" },
  { value: "tridosha", label: "Tridosha",  desc: "Balances all three" },
];

const CERTIFICATIONS = ["USDA Organic", "GMP Certified", "ISO 9001", "FSSAI Approved", "Ayush Certified", "Non-GMO"];

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepBar({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: i < current ? "var(--sage-600)" : i === current ? "var(--sage-700)" : "var(--cream-dark)",
                color: i <= current ? "#fff" : "var(--text-muted)",
              }}
            >
              {i < current ? <Check size={12} /> : i + 1}
            </div>
            <span className="text-xs font-medium hidden sm:block"
              style={{ color: i === current ? "var(--text-primary)" : "var(--text-muted)" }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px mx-3"
              style={{ background: i < current ? "var(--sage-400)" : "var(--border)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Field helper — defined OUTSIDE AddProductPage so React never remounts it ───
function Field({ label, required, error, children, hint }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[var(--text-muted)] mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

// ── Image Upload Zone ──────────────────────────────────────────────────────────
function ImageUploadZone({
  images, onAdd, onRemove, onSetPrimary
}: {
  images: ProductImage[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onSetPrimary: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    onAdd(files);
  }, [onAdd]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-sm cursor-pointer transition-all flex flex-col items-center justify-center py-10 gap-3"
        style={{
          borderColor: dragOver ? "var(--sage-500)" : "var(--border)",
          background: dragOver ? "var(--sage-50)" : "var(--cream)",
        }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "var(--sage-100)" }}>
          <Upload size={20} color="var(--sage-600)" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Drop images here or click to upload
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            PNG, JPG, WebP — Max 5MB each — Multiple images allowed
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => onAdd(Array.from(e.target.files || []))}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group rounded border overflow-hidden"
              style={{ borderColor: img.isPrimary ? "var(--sage-500)" : "var(--border-light)" }}>
              <img src={img.preview} alt="" className="w-full aspect-square object-cover" />
              {img.isPrimary && (
                <div className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                  style={{ background: "var(--sage-600)", color: "#fff" }}>
                  Primary
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(i)}
                    className="text-[10px] font-medium px-2 py-1 rounded text-white border border-white/50 hover:bg-white/20 transition-colors"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X size={12} color="#fff" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          {images.length} image{images.length > 1 ? "s" : ""} selected.
          Hover over an image to set it as primary or remove it.
        </p>
      )}
    </div>
  );
}

// ── Preview Card — defined OUTSIDE AddProductPage so React never remounts it ───
function PreviewCard({ images, form }: { images: ProductImage[]; form: any }) {
  return (
    <div className="bg-white rounded border border-[var(--border-light)] overflow-hidden">
      <div className="aspect-square bg-[var(--cream-dark)] flex items-center justify-center">
        {images.length > 0 ? (
          <img src={images.find(i => i.isPrimary)?.preview || images[0].preview}
            className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="text-center">
            <ImageIcon size={32} color="var(--text-muted)" className="mx-auto mb-2" />
            <p className="text-xs text-[var(--text-muted)]">No image yet</p>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
            {DOSHA_OPTIONS.find(d => d.value === form.dosha_type)?.label}
          </span>
          {form.is_featured && (
            <span className="text-[10px] px-2 py-0.5 rounded-sm font-medium"
              style={{ background: "var(--gold-400)", color: "#fff" }}>Featured</span>
          )}
        </div>
        <h3 className="font-medium text-[var(--text-primary)] text-sm line-clamp-2 mb-1">
          {form.name || "Product Name"}
        </h3>
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">
          {form.short_description || "Short description will appear here"}
        </p>
        <div className="flex items-center gap-2">
          {form.sale_price ? (
            <>
              <span className="font-bold text-[var(--sage-700)]">
                Rs.{parseFloat(form.sale_price || "0").toFixed(0)}
              </span>
              <span className="text-xs text-[var(--text-muted)] line-through">
                Rs.{parseFloat(form.price || "0").toFixed(0)}
              </span>
            </>
          ) : (
            <span className="font-bold text-[var(--text-primary)]">
              Rs.{parseFloat(form.price || "0").toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AddProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const STEPS = ["Basic Info", "Pricing & Stock", "Ayurvedic Details", "Images", "Review"];

  const [form, setForm] = useState({
    name: "", sku: "", category_id: "", dosha_type: "none",
    price: "", sale_price: "", stock: "0", low_stock_threshold: "10",
    weight_grams: "", short_description: "", description: "",
    usage_instructions: "", meta_title: "", meta_description: "",
    is_active: true, is_featured: false,
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: "", quantity: "" }]);
  const [benefits, setBenefits] = useState<string[]>([""]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/products/categories");
        return res.data;
      } catch { return []; }
    },
  });

  const handleAddImages = (files: File[]) => {
    const newImages = files.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0 && i === 0,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (prev[index].isPrimary && next.length > 0) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  const handleSetPrimary = (index: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!form.name.trim()) return "Product name is required";
      if (!form.sku.trim()) return "SKU is required";
      if (!form.short_description.trim()) return "Short description is required";
    }
    if (s === 1) {
      if (!form.price || parseFloat(form.price) <= 0) return "Valid price is required";
      if (form.sale_price && parseFloat(form.sale_price) >= parseFloat(form.price))
        return "Sale price must be less than regular price";
      if (parseInt(form.stock) < 0) return "Stock cannot be negative";
    }
    if (s === 3) {
      if (images.length === 0) return "Please add at least one product image";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo(0, 0);
  };

  const createProduct = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const payload: any = {
        name: form.name,
        sku: form.sku.toUpperCase(),
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        low_stock_threshold: parseInt(form.low_stock_threshold),
        dosha_type: form.dosha_type,
        is_active: form.is_active,
        is_featured: form.is_featured,
        short_description: form.short_description || null,
        description: form.description || null,
        usage_instructions: form.usage_instructions || null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
      };
      if (form.sale_price) payload.sale_price = parseFloat(form.sale_price);
      if (form.weight_grams) payload.weight_grams = parseInt(form.weight_grams);
      if (form.category_id) payload.category_id = parseInt(form.category_id);
      const validIngredients = ingredients.filter(i => i.name.trim());
      if (validIngredients.length > 0) payload.ingredients = validIngredients;
      const validBenefits = benefits.filter(b => b.trim());
      if (validBenefits.length > 0) payload.benefits = validBenefits;
      if (certifications.length > 0) payload.certifications = certifications;

      const productRes = await apiClient.post("/products", payload);
      const productId = productRes.data.id;

      for (let i = 0; i < images.length; i++) {
        const formData = new FormData();
        formData.append("file", images[i].file);
        await apiClient.post(
          `/products/${productId}/images?is_primary=${images[i].isPrimary}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }
      return productRes.data;
    },
    onSuccess: (data) => {
      toast.success("Product created successfully!");
      router.push("/admin/products");
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to create product");
    },
    onSettled: () => setUploading(false),
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Top bar */}
      <div className="bg-white border-b border-[var(--border-light)] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/products"
              className="p-1.5 hover:bg-[var(--cream)] rounded transition-colors text-[var(--text-muted)]">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Admin / Products</p>
              <h1 className="font-display text-lg font-medium text-[var(--text-primary)] leading-tight">
                Add New Product
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-sm transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              {previewMode ? <EyeOff size={13} /> : <Eye size={13} />}
              {previewMode ? "Hide Preview" : "Preview"}
            </button>
            {step === STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => createProduct.mutate()}
                disabled={createProduct.isPending || uploading}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white rounded-sm disabled:opacity-50"
                style={{ background: "var(--sage-600)" }}>
                {uploading ? (
                  <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                ) : (
                  <><Save size={13} />Publish Product</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <StepBar current={step} steps={STEPS} />

        <div className={`grid gap-8 ${previewMode ? "grid-cols-3" : "grid-cols-1"}`}>
          <div className={previewMode ? "col-span-2" : "col-span-1"}>

            {/* ── STEP 0: Basic Info ─────────────────────────────────────── */}
            {step === 0 && (
              <div className="bg-white rounded border border-[var(--border-light)] p-6 space-y-5">
                <div className="flex items-center gap-2 pb-4 border-b border-[var(--border-light)]">
                  <Package size={18} color="var(--sage-600)" />
                  <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                    Basic Information
                  </h2>
                </div>

                <Field label="Product Name" required>
                  <input value={form.name}
                    onChange={e => set("name", e.target.value)}
                    placeholder="e.g. Ashwagandha Root Powder 500g"
                    className="input-field text-base" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="SKU" required hint="Unique product code (e.g. AWG-500-P)">
                    <input value={form.sku}
                      onChange={e => set("sku", e.target.value.toUpperCase())}
                      placeholder="AWG-001"
                      className="input-field font-mono uppercase" />
                  </Field>
                  <Field label="Category">
                    <select value={form.category_id}
                      onChange={e => set("category_id", e.target.value)}
                      className="input-field">
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Short Description" required hint="Shown on product cards — max 200 chars">
                  <textarea value={form.short_description}
                    onChange={e => set("short_description", e.target.value)}
                    rows={2}
                    maxLength={200}
                    placeholder="Pure organic ashwagandha root powder for stress relief and vitality"
                    className="input-field resize-none" />
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 text-right">
                    {form.short_description.length}/200
                  </p>
                </Field>

                <Field label="Full Description">
                  <textarea value={form.description}
                    onChange={e => set("description", e.target.value)}
                    rows={5}
                    placeholder="Detailed product description, benefits, and how it works..."
                    className="input-field resize-none" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Weight (grams)">
                    <input value={form.weight_grams}
                      onChange={e => set("weight_grams", e.target.value)}
                      type="number" placeholder="500"
                      className="input-field" />
                  </Field>
                  <div className="space-y-3 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_active}
                        onChange={e => set("is_active", e.target.checked)}
                        className="w-4 h-4 accent-[var(--sage-600)]" />
                      <span className="text-sm text-[var(--text-secondary)]">Active (visible in store)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_featured}
                        onChange={e => set("is_featured", e.target.checked)}
                        className="w-4 h-4 accent-[var(--gold-500)]" />
                      <span className="text-sm text-[var(--text-secondary)]">Featured product</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 1: Pricing & Stock ────────────────────────────────── */}
            {step === 1 && (
              <div className="bg-white rounded border border-[var(--border-light)] p-6 space-y-5">
                <div className="flex items-center gap-2 pb-4 border-b border-[var(--border-light)]">
                  <IndianRupee size={18} color="var(--sage-600)" />
                  <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                    Pricing & Stock
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Regular Price (Rs.)" required>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">Rs.</span>
                      <input value={form.price}
                        onChange={e => set("price", e.target.value)}
                        type="number" step="0.01" min="0" placeholder="299.00"
                        className="input-field pl-9" />
                    </div>
                  </Field>
                  <Field label="Sale Price (Rs.)" hint="Leave empty if not on sale">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">Rs.</span>
                      <input value={form.sale_price}
                        onChange={e => set("sale_price", e.target.value)}
                        type="number" step="0.01" min="0" placeholder="249.00"
                        className="input-field pl-9" />
                    </div>
                  </Field>
                </div>

                {form.price && (
                  <div className="p-4 rounded" style={{ background: "var(--sage-50)", border: "1px solid var(--sage-200)" }}>
                    <p className="text-xs text-[var(--text-muted)] mb-2">Price Preview</p>
                    <div className="flex items-center gap-3">
                      {form.sale_price && parseFloat(form.sale_price) < parseFloat(form.price) ? (
                        <>
                          <span className="text-2xl font-bold text-[var(--sage-700)]">
                            Rs.{parseFloat(form.sale_price).toFixed(0)}
                          </span>
                          <span className="text-sm text-[var(--text-muted)] line-through">
                            Rs.{parseFloat(form.price).toFixed(0)}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {Math.round((1 - parseFloat(form.sale_price) / parseFloat(form.price)) * 100)}% OFF
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-[var(--text-primary)]">
                          Rs.{parseFloat(form.price || "0").toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Stock Quantity" required>
                    <div className="relative">
                      <Boxes size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input value={form.stock}
                        onChange={e => set("stock", e.target.value)}
                        type="number" min="0" placeholder="100"
                        className="input-field pl-9" />
                    </div>
                  </Field>
                  <Field label="Low Stock Alert" hint="Alert when stock falls below this">
                    <input value={form.low_stock_threshold}
                      onChange={e => set("low_stock_threshold", e.target.value)}
                      type="number" min="0" placeholder="10"
                      className="input-field" />
                  </Field>
                </div>

                {form.price && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Base Price", value: "Rs." + (parseFloat(form.sale_price || form.price || "0")).toFixed(0) },
                      { label: "GST (18%)", value: "Rs." + (parseFloat(form.sale_price || form.price || "0") * 0.18).toFixed(0) },
                      { label: "Customer Pays", value: "Rs." + (parseFloat(form.sale_price || form.price || "0") * 1.18).toFixed(0) },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded border border-[var(--border-light)] text-center">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{s.label}</p>
                        <p className="font-semibold text-[var(--text-primary)] mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-[var(--border-light)]">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">SEO (Optional)</p>
                  <div className="space-y-3">
                    <Field label="Meta Title">
                      <input value={form.meta_title}
                        onChange={e => set("meta_title", e.target.value)}
                        placeholder="Buy Ashwagandha Root Powder Online | AyurVeda"
                        className="input-field" maxLength={60} />
                    </Field>
                    <Field label="Meta Description">
                      <textarea value={form.meta_description}
                        onChange={e => set("meta_description", e.target.value)}
                        rows={2} maxLength={160}
                        placeholder="Premium organic ashwagandha for stress relief..."
                        className="input-field resize-none" />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Ayurvedic Details ──────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="bg-white rounded border border-[var(--border-light)] p-6 space-y-5">
                  <div className="flex items-center gap-2 pb-4 border-b border-[var(--border-light)]">
                    <Leaf size={18} color="var(--sage-600)" />
                    <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                      Ayurvedic Details
                    </h2>
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-3">
                      Dosha Type
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {DOSHA_OPTIONS.map(d => (
                        <button key={d.value} type="button"
                          onClick={() => set("dosha_type", d.value)}
                          className="p-3 rounded border text-center transition-all"
                          style={{
                            borderColor: form.dosha_type === d.value ? "var(--sage-500)" : "var(--border-light)",
                            background: form.dosha_type === d.value ? "var(--sage-50)" : "#fff",
                          }}>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{d.label}</p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">{d.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Ingredients
                      </label>
                      <button type="button"
                        onClick={() => setIngredients(p => [...p, { name: "", quantity: "" }])}
                        className="flex items-center gap-1 text-xs text-[var(--sage-600)] hover:text-[var(--sage-800)]">
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {ingredients.map((ing, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={ing.name}
                            onChange={e => setIngredients(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                            placeholder="Ingredient name (e.g. Ashwagandha)"
                            className="input-field flex-1" />
                          <input
                            value={ing.quantity}
                            onChange={e => setIngredients(p => p.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))}
                            placeholder="Qty (e.g. 500mg)"
                            className="input-field w-32" />
                          {ingredients.length > 1 && (
                            <button type="button"
                              onClick={() => setIngredients(p => p.filter((_, j) => j !== i))}
                              className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Key Benefits
                      </label>
                      <button type="button"
                        onClick={() => setBenefits(p => [...p, ""])}
                        className="flex items-center gap-1 text-xs text-[var(--sage-600)] hover:text-[var(--sage-800)]">
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {benefits.map((b, i) => (
                        <div key={i} className="flex gap-2">
                          <div className="flex items-center justify-center w-6 shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--sage-500)" }} />
                          </div>
                          <input
                            value={b}
                            onChange={e => setBenefits(p => p.map((x, j) => j === i ? e.target.value : x))}
                            placeholder="e.g. Reduces stress and anxiety"
                            className="input-field flex-1" />
                          {benefits.length > 1 && (
                            <button type="button"
                              onClick={() => setBenefits(p => p.filter((_, j) => j !== i))}
                              className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Field label="Usage Instructions">
                    <textarea value={form.usage_instructions}
                      onChange={e => set("usage_instructions", e.target.value)}
                      rows={3}
                      placeholder="Take 1-2 teaspoons with warm milk or water before bedtime..."
                      className="input-field resize-none" />
                  </Field>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-3">
                      Certifications
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CERTIFICATIONS.map(cert => (
                        <button key={cert} type="button"
                          onClick={() => setCertifications(p =>
                            p.includes(cert) ? p.filter(c => c !== cert) : [...p, cert]
                          )}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                          style={{
                            borderColor: certifications.includes(cert) ? "var(--sage-500)" : "var(--border-light)",
                            background: certifications.includes(cert) ? "var(--sage-50)" : "#fff",
                            color: certifications.includes(cert) ? "var(--sage-700)" : "var(--text-muted)",
                          }}>
                          {certifications.includes(cert) && <Check size={10} />}
                          {cert}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Images ─────────────────────────────────────────── */}
            {step === 3 && (
              <div className="bg-white rounded border border-[var(--border-light)] p-6 space-y-5">
                <div className="flex items-center gap-2 pb-4 border-b border-[var(--border-light)]">
                  <ImageIcon size={18} color="var(--sage-600)" />
                  <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
                    Product Images
                  </h2>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Upload high-quality product images. The first image or the one marked as primary
                  will be shown on product listings. Recommended: 1200x1200px square images.
                </p>
                <ImageUploadZone
                  images={images}
                  onAdd={handleAddImages}
                  onRemove={handleRemoveImage}
                  onSetPrimary={handleSetPrimary}
                />
                {images.length === 0 && (
                  <div className="flex items-start gap-2 p-3 rounded text-xs"
                    style={{ background: "#FFF8E1", border: "1px solid #FFE082", color: "#5D4037" }}>
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    At least one image is required to publish the product.
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: Review ─────────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="bg-white rounded border border-[var(--border-light)] p-6">
                  <h2 className="font-display text-xl font-medium text-[var(--text-primary)] mb-5">
                    Review Product
                  </h2>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Product</p>
                        <p className="font-medium text-[var(--text-primary)]">{form.name}</p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">{form.sku}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Pricing</p>
                        <p className="font-medium">
                          Rs.{parseFloat(form.price || "0").toFixed(0)}
                          {form.sale_price && <span className="text-green-600 ml-2 text-sm">→ Rs.{parseFloat(form.sale_price).toFixed(0)}</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Stock</p>
                        <p className="font-medium">{form.stock} units (alert at {form.low_stock_threshold})</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Dosha</p>
                        <p className="font-medium capitalize">{form.dosha_type}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Images</p>
                        <div className="flex gap-2">
                          {images.slice(0, 4).map((img, i) => (
                            <div key={i} className="w-12 h-12 rounded overflow-hidden border border-[var(--border-light)]">
                              <img src={img.preview} className="w-full h-full object-cover" alt="" />
                            </div>
                          ))}
                          {images.length === 0 && <p className="text-sm text-red-500">No images — required!</p>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Ingredients</p>
                        <p className="text-sm">{ingredients.filter(i => i.name).length} ingredient{ingredients.filter(i => i.name).length !== 1 ? "s" : ""} added</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Benefits</p>
                        <p className="text-sm">{benefits.filter(b => b).length} benefit{benefits.filter(b => b).length !== 1 ? "s" : ""} added</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-1">Status</p>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${form.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {form.is_active ? "Active" : "Inactive"}
                          </span>
                          {form.is_featured && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {certifications.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
                      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">Certifications</p>
                      <div className="flex gap-2 flex-wrap">
                        {certifications.map(c => (
                          <span key={c} className="text-xs px-2 py-0.5 rounded-full border"
                            style={{ borderColor: "var(--sage-300)", color: "var(--sage-700)", background: "var(--sage-50)" }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {images.length === 0 && (
                  <div className="flex items-center gap-2 p-4 rounded"
                    style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                    <AlertCircle size={16} color="#DC2626" />
                    <p className="text-sm text-red-700">
                      Product has no images. Go back to Step 4 to add at least one image before publishing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium border rounded-sm disabled:opacity-40 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                <ArrowLeft size={14} />
                Previous
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-sm"
                  style={{ background: "var(--sage-600)" }}>
                  Next Step
                  <ArrowLeft size={14} className="rotate-180" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => createProduct.mutate()}
                  disabled={createProduct.isPending || uploading || images.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-sm disabled:opacity-50"
                  style={{ background: "var(--sage-600)" }}>
                  {uploading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publishing...</>
                  ) : (
                    <><Save size={14} />Publish Product</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Preview panel */}
          {previewMode && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">Live Preview</p>
              <PreviewCard images={images} form={form} />
              <div className="mt-4 p-3 rounded text-xs text-[var(--text-muted)]"
                style={{ background: "var(--cream-dark)" }}>
                This is how your product will appear on the store listing page.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}