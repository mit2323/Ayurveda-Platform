
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import type { Product } from "@/types";

interface ProductCardProps {
    product: Product;
}

const DOSHA_BADGES: Record<string, { bg: string; color: string }> = {
    vata: { bg: "#E8F0FF", color: "#3B5BDB" },
    pitta: { bg: "#FFF3E0", color: "#E65100" },
    kapha: { bg: "#E8F5E9", color: "#2E7D32" },
    tridosha: { bg: "#F3E5F5", color: "#6A1B9A" },
    none: { bg: "var(--cream-dark)", color: "var(--text-muted)" },
};

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCartStore();

    const price = parseFloat(String(product.price));
    const salePrice = product.sale_price ? parseFloat(String(product.sale_price)) : null;
    const isOnSale = salePrice !== null && salePrice < price;
    const displayPrice = isOnSale ? salePrice! : price;
    const badge = DOSHA_BADGES[product.dosha_type] || DOSHA_BADGES.none;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem({
            product_id: product.id,
            quantity: 1,
            name: product.name,
            price: displayPrice,
            image_url: product.primary_image_url,
            slug: product.slug,
        });
    };

    return (
        <Link href={`/shop/products/${product.slug}`} className="card-product block group">
            <div
                className="relative overflow-hidden"
                style={{ aspectRatio: "1/1", background: "var(--cream-dark)" }}
            >
                {product.primary_image_url ? (
                    <Image
                        src={product.primary_image_url}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-30">🌿</span>
                    </div>
                )}

                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {isOnSale && (
                        <span className="bg-[var(--sage-600)] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                            Sale
                        </span>
                    )}
                    {product.is_featured && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-sm uppercase tracking-wide"
                            style={{ background: "var(--gold-400)", color: "#fff" }}>
                            Featured
                        </span>
                    )}
                    {product.stock === 0 && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-medium px-2 py-0.5 rounded-sm uppercase tracking-wide">
                            Sold Out
                        </span>
                    )}
                </div>

                <button
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:text-red-500"
                    onClick={(e) => { e.preventDefault(); }}
                >
                    <Heart size={14} />
                </button>
            </div>

            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    {product.category && (
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                            {product.category.name}
                        </span>
                    )}
                    {product.dosha_type !== "none" && (
                        <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-sm uppercase tracking-wide"
                            style={{ background: badge.bg, color: badge.color }}
                        >
                            {product.dosha_type}
                        </span>
                    )}
                </div>

                <h3 className="text-sm font-medium text-[var(--text-primary)] leading-tight mb-2 line-clamp-2"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {product.name}
                </h3>

                {product.average_rating !== null && (
                    <div className="flex items-center gap-1 mb-3">
                        <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={11}
                                    className={i < Math.round(product.average_rating!) ? "star-filled fill-current" : "star-empty"}
                                />
                            ))}
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)]">({product.review_count})</span>
                    </div>
                )}

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">
                            ₹{displayPrice.toFixed(0)}
                        </span>
                        {isOnSale && (
                            <span className="text-xs text-[var(--text-muted)] line-through">
                                ₹{price.toFixed(0)}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "var(--sage-100)", color: "var(--sage-700)" }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--sage-600)";
                            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = "var(--sage-100)";
                            (e.currentTarget as HTMLButtonElement).style.color = "var(--sage-700)";
                        }}
                    >
                        <ShoppingCart size={12} />
                        Add
                    </button>
                </div>
            </div>
        </Link>
    );
}