"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, Search, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useMounted } from "@/hooks/useMounted";
export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();
    const { user, isAuthenticated, clearAuth } = useAuthStore();
    const { itemCount, toggleCart } = useCartStore();
    const count = itemCount();
    const mounted = useMounted();
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isHome = pathname === "/";
    const transparent = isHome && !scrolled;

    const navLinks = [
        { href: "/shop/products", label: "Shop" },
        { href: "/shop/products?dosha_type=vata", label: "Vata" },
        { href: "/shop/products?dosha_type=pitta", label: "Pitta" },
        { href: "/shop/products?dosha_type=kapha", label: "Kapha" },
        { href: "/about", label: "About" },
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${transparent
                ? "bg-transparent"
                : "bg-white/95 backdrop-blur-md border-b border-[var(--border-light)]"
                }`}
            style={{ boxShadow: scrolled ? "0 2px 20px rgba(90,60,30,0.08)" : "none" }}
        >
            <div className="container-main">
                <div className="flex items-center justify-between h-16 md:h-20">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-full bg-[var(--sage-600)] flex items-center justify-center">
                            <span className="text-white font-display text-sm font-bold">A</span>
                        </div>
                        <span
                            className="font-display text-xl font-medium tracking-wide"
                            style={{ color: transparent ? "#fff" : "var(--text-primary)" }}
                        >
                            AyurVeda
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm font-medium tracking-wide uppercase transition-colors duration-200 hover:opacity-70 ${transparent ? "text-white/90" : "text-[var(--text-secondary)]"
                                    } ${pathname === link.href ? "border-b border-current" : ""}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Icons */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/shop/products"
                            className={`p-2 rounded-full transition-colors hover:bg-black/5 ${transparent ? "text-white" : "text-[var(--text-secondary)]"
                                }`}
                        >
                            <Search size={18} />
                        </Link>

                        <button
                            onClick={toggleCart}
                            className={`relative p-2 rounded-full transition-colors hover:bg-black/5 ${transparent ? "text-white" : "text-[var(--text-secondary)]"
                                }`}
                        >
                            <ShoppingCart size={18} />
                            {mounted && count > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--sage-600)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {count > 9 ? "9+" : count}
                                </span>
                            )}
                        </button>

                        {isAuthenticated ? (
                            <div className="relative group">
                                <button
                                    className={`flex items-center gap-2 p-2 rounded-full transition-colors hover:bg-black/5 ${transparent ? "text-white" : "text-[var(--text-secondary)]"
                                        }`}
                                >
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-[var(--sage-100)] flex items-center justify-center">
                                            <span className="text-[var(--sage-700)] text-xs font-bold">
                                                {user?.full_name?.[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </button>

                                {/* Dropdown */}
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[var(--border-light)] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1">
                                    <div className="px-4 py-2 border-b border-[var(--border-light)]">
                                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.full_name}</p>
                                        <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                                    </div>
                                    <Link href="/shop/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--cream)] transition-colors">
                                        Orders
                                    </Link>
                                    {(user?.role === "admin" || user?.role === "superadmin") && (
                                        <Link href="/admin/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--cream)] transition-colors">
                                            <LayoutDashboard size={14} />
                                            Admin Panel
                                        </Link>
                                    )}
                                    <button
                                        onClick={clearAuth}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                    >
                                        <LogOut size={14} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link
                                href="/auth/login"
                                className={`hidden md:flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70 ${transparent ? "text-white" : "text-[var(--text-secondary)]"
                                    }`}
                            >
                                <User size={16} />
                                Sign In
                            </Link>
                        )}

                        {/* Mobile menu toggle */}
                        <button
                            className={`md:hidden p-2 ${transparent ? "text-white" : "text-[var(--text-secondary)]"}`}
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden bg-white border-t border-[var(--border-light)]">
                    <div className="container-main py-4 flex flex-col gap-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide py-2"
                                onClick={() => setMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {!isAuthenticated && (
                            <Link href="/auth/login" className="btn-primary text-center mt-2">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}