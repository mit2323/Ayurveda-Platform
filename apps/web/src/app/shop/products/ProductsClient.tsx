"use client";
import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import apiClient from "@/lib/axios";
import ProductCard from "@/components/shop/ProductCard";
import type { Product, PaginatedResponse } from "@/types";

const DOSHA_OPTIONS = [
    { value: "", label: "All Doshas" },
    { value: "vata", label: "Vata" },
    { value: "pitta", label: "Pitta" },
    { value: "kapha", label: "Kapha" },
    { value: "tridosha", label: "Tridosha" },
];

const SORT_OPTIONS = [
    { value: "created_at_desc", label: "Newest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "name_asc", label: "Name: A–Z" },
];

export default function ProductsClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [showFilters, setShowFilters] = useState(false);

    const [search, setSearch] = useState(searchParams.get("q") || "");
    const [dosha, setDosha] = useState(searchParams.get("dosha_type") || "");
    const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
    const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
    const [sort, setSort] = useState("created_at_desc");
    const [page, setPage] = useState(1);
    const [inStock, setInStock] = useState(false);

    const [sortBy, sortOrder] = sort.split("_").reduce((acc: string[], part, i, arr) => {
        if (i === arr.length - 1) { acc[1] = part; } else { acc[0] = (acc[0] || "") + (i > 0 ? "_" : "") + part; }
        return acc;
    }, []);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["products", { search, dosha, minPrice, maxPrice, sortBy, sortOrder, page, inStock }],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                page_size: "12",
                sort_by: sortBy || "created_at",
                sort_order: sortOrder || "desc",
            });
            if (search) params.set("q", search);
            if (dosha) params.set("dosha_type", dosha);
            if (minPrice) params.set("min_price", minPrice);
            if (maxPrice) params.set("max_price", maxPrice);
            if (inStock) params.set("in_stock", "true");
            const res = await apiClient.get<PaginatedResponse<Product>>(`/products?${params}`);
            return res.data;
        },
        placeholderData: (prev) => prev,
    });

    const clearFilters = () => {
        setSearch(""); setDosha(""); setMinPrice(""); setMaxPrice(""); setInStock(false); setPage(1);
    };

    const hasFilters = search || dosha || minPrice || maxPrice || inStock;

    return (
        <div className="container-main py-10">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-display text-4xl text-[var(--text-primary)] mb-1">Our Products</h1>
                <p className="text-[var(--text-muted)]">
                    {data ? `${data.total} products` : "Explore our collection"}
                </p>
            </div>

            {/* Search + Filter bar */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search herbs, products..."
                        className="input-field pl-9"
                    />
                </div>

                {/* Dosha filter */}
                <select
                    value={dosha}
                    onChange={(e) => { setDosha(e.target.value); setPage(1); }}
                    className="input-field md:w-44"
                >
                    {DOSHA_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {/* Sort */}
                <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    className="input-field md:w-52"
                >
                    {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {/* Filter toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 border rounded-sm text-sm font-medium transition-colors"
                    style={{
                        borderColor: showFilters ? "var(--sage-500)" : "var(--border)",
                        color: showFilters ? "var(--sage-600)" : "var(--text-secondary)",
                        background: showFilters ? "var(--sage-50)" : "#fff",
                    }}
                >
                    <SlidersHorizontal size={16} />
                    Filters
                    {hasFilters && (
                        <span className="w-2 h-2 rounded-full bg-[var(--sage-500)]" />
                    )}
                </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
                <div
                    className="bg-white border rounded-sm p-5 mb-6 flex flex-wrap gap-5 items-end"
                    style={{ borderColor: "var(--border-light)" }}
                >
                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Min Price (₹)</label>
                        <input
                            type="number"
                            value={minPrice}
                            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                            placeholder="0"
                            className="input-field w-28"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Max Price (₹)</label>
                        <input
                            type="number"
                            value={maxPrice}
                            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                            placeholder="Any"
                            className="input-field w-28"
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={inStock}
                            onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                            className="w-4 h-4 accent-[var(--sage-600)]"
                        />
                        <span className="text-sm text-[var(--text-secondary)]">In stock only</span>
                    </label>
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors"
                        >
                            <X size={14} />
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* Product grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="rounded overflow-hidden">
                            <div className="skeleton" style={{ aspectRatio: "1/1" }} />
                            <div className="p-4 space-y-2">
                                <div className="skeleton h-3 w-3/4" />
                                <div className="skeleton h-3 w-1/2" />
                                <div className="skeleton h-8 w-full mt-3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="text-center py-20">
                    <p className="text-[var(--text-muted)]">Failed to load products. Please try again.</p>
                </div>
            ) : data?.items.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-4xl mb-4">🌿</div>
                    <p className="font-display text-xl text-[var(--text-primary)] mb-2">No products found</p>
                    <p className="text-[var(--text-muted)]">Try adjusting your filters</p>
                    {hasFilters && (
                        <button onClick={clearFilters} className="btn-outline mt-6">Clear All Filters</button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {data?.items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {data && data.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border rounded-sm disabled:opacity-40 hover:bg-[var(--cream-dark)] transition-colors"
                        style={{ borderColor: "var(--border)" }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: data.total_pages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === data.total_pages || Math.abs(p - page) <= 1)
                        .reduce((acc: (number | string)[], p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                            acc.push(p);
                            return acc;
                        }, [])
                        .map((p, i) =>
                            p === "..." ? (
                                <span key={i} className="px-2 text-[var(--text-muted)]">…</span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => setPage(p as number)}
                                    className="w-8 h-8 text-sm rounded-sm transition-colors"
                                    style={{
                                        background: page === p ? "var(--sage-600)" : "transparent",
                                        color: page === p ? "#fff" : "var(--text-secondary)",
                                        border: page === p ? "none" : "1px solid var(--border)",
                                    }}
                                >
                                    {p}
                                </button>
                            )
                        )}
                    <button
                        onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                        disabled={page === data.total_pages}
                        className="p-2 border rounded-sm disabled:opacity-40 hover:bg-[var(--cream-dark)] transition-colors"
                        style={{ borderColor: "var(--border)" }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}