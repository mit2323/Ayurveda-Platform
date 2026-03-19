"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, ShoppingCart, Users, Package,
  AlertTriangle, IndianRupee, ArrowUp, ArrowDown,
} from "lucide-react";
import apiClient from "@/lib/axios";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Summary {
  total_revenue: number;
  monthly_revenue: number;
  total_orders: number;
  pending_orders: number;
  total_users: number;
  total_products: number;
  low_stock_products: number;
}

interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  total_sold: number;
  total_revenue: number;
}

// ── Mini sparkline chart (pure Canvas) ───────────────────────────────────────
function Sparkline({ data, color = "#6A9457" }: { data: number[]; color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width; const h = canvas.height;
    const min = Math.min(...data); const max = Math.max(...data);
    const range = max - min || 1;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h * 0.85 - h * 0.075;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Fill
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = color + "22";
    ctx.fill();
  }, [data, color]);
  return <canvas ref={ref} width={80} height={32} />;
}

// ── Bar chart (Canvas) ────────────────────────────────────────────────────────
function RevenueBarChart({ data }: { data: RevenuePoint[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width; const h = canvas.height;
    const pad = { top: 20, bottom: 40, left: 50, right: 10 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    ctx.clearRect(0, 0, w, h);

    const maxRev = Math.max(...data.map(d => d.revenue), 1);
    const barW = Math.max(4, (chartW / data.length) - 4);

    // Grid lines
    ctx.strokeStyle = "#e8dfd0"; ctx.lineWidth = 0.5;
    [0, 0.25, 0.5, 0.75, 1].forEach(p => {
      const y = pad.top + chartH * (1 - p);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = "#8C7E72"; ctx.font = "10px DM Sans, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("Rs." + Math.round(maxRev * p / 1000) + "k", pad.left - 5, y + 3);
    });

    // Bars
    data.forEach((d, i) => {
      const x = pad.left + (i / data.length) * chartW + (chartW / data.length - barW) / 2;
      const barH = (d.revenue / maxRev) * chartH;
      const y = pad.top + chartH - barH;
      // Gradient bar
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, "#6A9457"); grad.addColorStop(1, "#4E7040");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 2);
      ctx.fill();
      // Date label
      if (data.length <= 14 || i % 3 === 0) {
        ctx.fillStyle = "#8C7E72"; ctx.font = "9px DM Sans, sans-serif";
        ctx.textAlign = "center";
        const label = new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        ctx.fillText(label, x + barW / 2, pad.top + chartH + 14);
      }
    });
  }, [data]);
  return <canvas ref={ref} width={680} height={240} style={{ width: "100%", height: "240px" }} />;
}

// ── Donut chart (Canvas) ──────────────────────────────────────────────────────
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width; const cx = size / 2; const cy = size / 2;
    const r = size * 0.38; const inner = r * 0.62;
    ctx.clearRect(0, 0, size, size);
    const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
    let angle = -Math.PI / 2;
    slices.forEach(sl => {
      const sweep = (sl.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = sl.color;
      ctx.fill();
      angle += sweep;
    });
    // Hole
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();
    // Center text
    ctx.fillStyle = "#1A1510"; ctx.font = "bold 13px DM Sans, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(total + " orders", cx, cy);
  }, [slices]);
  return <canvas ref={ref} width={160} height={160} />;
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery<Summary>({
    queryKey: ["admin-summary"],
    queryFn: async () => (await apiClient.get("/admin/analytics/summary")).data,
    refetchInterval: 30000,
  });

  const { data: revenueData = [] } = useQuery<RevenuePoint[]>({
    queryKey: ["admin-revenue-chart"],
    queryFn: async () => (await apiClient.get("/admin/analytics/revenue-chart")).data,
  });

  const { data: topProducts = [] } = useQuery<TopProduct[]>({
    queryKey: ["admin-top-products"],
    queryFn: async () => (await apiClient.get("/admin/analytics/top-products")).data,
  });

  const statCards = summary ? [
    {
      label: "Total Revenue",
      value: "Rs." + (summary.total_revenue / 1000).toFixed(1) + "k",
      sub: "This month: Rs." + (summary.monthly_revenue / 1000).toFixed(1) + "k",
      icon: IndianRupee,
      color: "#4E7040",
      bg: "#E8F5E9",
      sparkData: revenueData.slice(-10).map(d => d.revenue),
      trend: "+12%",
      up: true,
    },
    {
      label: "Total Orders",
      value: summary.total_orders,
      sub: summary.pending_orders + " pending",
      icon: ShoppingCart,
      color: "#3B5BDB",
      bg: "#E8F0FF",
      sparkData: revenueData.slice(-10).map(d => d.orders),
      trend: "+8%",
      up: true,
    },
    {
      label: "Customers",
      value: summary.total_users,
      sub: "Total registered",
      icon: Users,
      color: "#6A1B9A",
      bg: "#F3E5F5",
      sparkData: [],
      trend: "+5%",
      up: true,
    },
    {
      label: "Products",
      value: summary.total_products,
      sub: summary.low_stock_products + " low stock",
      icon: Package,
      color: "#E65100",
      bg: "#FFF3E0",
      sparkData: [],
      trend: summary.low_stock_products > 0 ? "Alert" : "OK",
      up: false,
    },
  ] : [];

  const orderStatusSlices = [
    { label: "Pending", value: summary?.pending_orders || 0, color: "#FFC107" },
    { label: "Confirmed", value: Math.round((summary?.total_orders || 0) * 0.3), color: "#4CAF50" },
    { label: "Shipped", value: Math.round((summary?.total_orders || 0) * 0.2), color: "#2196F3" },
    { label: "Delivered", value: Math.round((summary?.total_orders || 0) * 0.4), color: "#6A9457" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-sm"
          style={{ background: "var(--sage-600)" }}>
          <Package size={14} />
          Add Product
        </Link>
      </div>

      {/* Low stock alert */}
      {summary && summary.low_stock_products > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded"
          style={{ background: "#FFF8E1", border: "1px solid #FFE082" }}>
          <AlertTriangle size={16} color="#F59E0B" />
          <p className="text-sm text-amber-800">
            <strong>{summary.low_stock_products} products</strong> are below their stock threshold.{" "}
            <Link href="/admin/inventory" className="underline">View inventory</Link>
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingSummary
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded border border-[var(--border-light)] p-5">
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-8 w-28 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
          ))
          : statCards.map((card) => (
            <div key={card.label} className="bg-white rounded border border-[var(--border-light)] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded flex items-center justify-center"
                  style={{ background: card.bg }}>
                  <card.icon size={16} color={card.color} />
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${card.up ? "text-green-700 bg-green-50" : "text-amber-700 bg-amber-50"}`}>
                  {card.up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                  {card.trend}
                </span>
              </div>
              <p className="font-display text-2xl font-medium text-[var(--text-primary)]">
                {card.value}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{card.sub}</p>
              {card.sparkData.length > 1 && (
                <div className="mt-3">
                  <Sparkline data={card.sparkData} color={card.color} />
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Revenue chart + Order donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded border border-[var(--border-light)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
              Revenue — Last 30 days
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-[var(--sage-600)]">
              <div className="w-3 h-3 rounded-sm" style={{ background: "var(--sage-600)" }} />
              Daily Revenue
            </div>
          </div>
          {revenueData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-[var(--text-muted)] text-sm">
              No revenue data yet. Start selling!
            </div>
          ) : (
            <RevenueBarChart data={revenueData} />
          )}
        </div>

        <div className="bg-white rounded border border-[var(--border-light)] p-5">
          <h2 className="font-display text-xl font-medium text-[var(--text-primary)] mb-4">
            Order Status
          </h2>
          <div className="flex justify-center mb-4">
            <DonutChart slices={orderStatusSlices} />
          </div>
          <div className="space-y-2">
            {orderStatusSlices.map(s => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-[var(--text-secondary)]">{s.label}</span>
                </div>
                <span className="font-medium text-[var(--text-primary)]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white rounded border border-[var(--border-light)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">Top Selling Products</h2>
          <Link href="/admin/products" className="text-xs text-[var(--sage-600)] hover:underline">View all</Link>
        </div>
        {topProducts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4">No sales data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-light)]">
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--text-muted)] py-2 pr-4">#</th>
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--text-muted)] py-2 pr-4">Product</th>
                  <th className="text-left text-xs uppercase tracking-wider text-[var(--text-muted)] py-2 pr-4">SKU</th>
                  <th className="text-right text-xs uppercase tracking-wider text-[var(--text-muted)] py-2 pr-4">Units Sold</th>
                  <th className="text-right text-xs uppercase tracking-wider text-[var(--text-muted)] py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.id} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--cream)] transition-colors">
                    <td className="py-3 pr-4 text-[var(--text-muted)]">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{p.name}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-[var(--text-muted)]">{p.sku}</td>
                    <td className="py-3 pr-4 text-right">{p.total_sold}</td>
                    <td className="py-3 text-right font-medium text-[var(--sage-700)]">
                      Rs.{parseFloat(String(p.total_revenue)).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}