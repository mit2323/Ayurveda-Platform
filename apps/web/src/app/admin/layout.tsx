"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  BarChart3, Boxes, LogOut, ChevronRight, Bell, Settings,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/customers", icon: Users, label: "Customers" },
  { href: "/admin/inventory", icon: Boxes, label: "Inventory" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  useEffect(() => {
    if (pathname === "/admin/login") return;
    if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "superadmin")) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, user, pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--cream)" }}>
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col"
        style={{ background: "#1a1510", minHeight: "100vh" }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center"
              style={{ background: "var(--sage-600)" }}>
              <span className="text-white font-display font-bold text-sm">A</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm leading-none">AyurVeda</p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all group"
                style={{
                  background: active ? "rgba(106,148,87,0.15)" : "transparent",
                  color: active ? "#8AAF78" : "rgba(255,255,255,0.55)",
                }}>
                <item.icon size={16} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={12} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user info + logout */}
        <div className="px-3 pb-4 border-t border-white/10 pt-4 space-y-1">
          <Link href="/admin/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-white/40 hover:text-white/70 transition-colors">
            <Settings size={16} />
            Settings
          </Link>
          <button onClick={() => { clearAuth(); router.push("/admin/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-white/40 hover:text-red-400 transition-colors w-full text-left">
            <LogOut size={16} />
            Sign Out
          </button>
          <div className="px-3 py-2 mt-2">
            <p className="text-white/70 text-xs font-medium truncate">{user?.full_name}</p>
            <p className="text-white/30 text-[10px] truncate">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-[var(--border-light)] shrink-0">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              {NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label || "Admin"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank"
              className="text-xs text-[var(--sage-600)] hover:underline">
              View Store
            </Link>
            <button className="relative p-2 hover:bg-[var(--cream)] rounded-full transition-colors">
              <Bell size={16} color="var(--text-secondary)" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--sage-100)", color: "var(--sage-700)" }}>
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}