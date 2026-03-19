"use client";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

interface RevenuePoint { date: string; revenue: number; orders: number; }
interface TopProduct { name: string; total_sold: number; total_revenue: number; }
interface Summary {
  total_revenue: number; monthly_revenue: number;
  total_orders: number; total_users: number; total_products: number;
}

// ── Line chart (Canvas) ───────────────────────────────────────────────────────
function LineChart({ data, field, color = "#6A9457", label = "" }: {
  data: RevenuePoint[]; field: "revenue" | "orders"; color?: string; label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const w = canvas.width; const h = canvas.height;
    const pad = { top: 20, bottom: 40, left: 55, right: 15 };
    const cw = w - pad.left - pad.right; const ch = h - pad.top - pad.bottom;
    ctx.clearRect(0, 0, w, h);
    const vals = data.map(d => d[field] as number);
    const max = Math.max(...vals, 1); const min = Math.min(...vals);

    // Grid
    ctx.strokeStyle = "#e8dfd0"; ctx.lineWidth = 0.5;
    [0, 0.25, 0.5, 0.75, 1].forEach(p => {
      const y = pad.top + ch * (1 - p);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      const val = min + (max - min) * p;
      ctx.fillStyle = "#8C7E72"; ctx.font = "10px DM Sans, sans-serif"; ctx.textAlign = "right";
      ctx.fillText(field === "revenue" ? "Rs." + Math.round(val / 1000) + "k" : String(Math.round(val)), pad.left - 5, y + 3);
    });

    // Area fill
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.left + (i / (data.length - 1)) * cw;
      const y = pad.top + ch - ((d[field] as number - min) / (max - min || 1)) * ch * 0.9;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    const lastX = pad.left + cw; const firstX = pad.left;
    ctx.lineTo(lastX, pad.top + ch); ctx.lineTo(firstX, pad.top + ch); ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    grad.addColorStop(0, color + "44"); grad.addColorStop(1, color + "00");
    ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.left + (i / (data.length - 1)) * cw;
      const y = pad.top + ch - ((d[field] as number - min) / (max - min || 1)) * ch * 0.9;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();

    // Dots
    data.forEach((d, i) => {
      if (data.length > 20 && i % 3 !== 0) return;
      const x = pad.left + (i / (data.length - 1)) * cw;
      const y = pad.top + ch - ((d[field] as number - min) / (max - min || 1)) * ch * 0.9;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // X labels
    data.forEach((d, i) => {
      if (data.length > 14 && i % 3 !== 0) return;
      const x = pad.left + (i / (data.length - 1)) * cw;
      ctx.fillStyle = "#8C7E72"; ctx.font = "9px DM Sans, sans-serif"; ctx.textAlign = "center";
      const dt = new Date(d.date);
      ctx.fillText(dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), x, pad.top + ch + 14);
    });
  }, [data, field, color]);
  return (
    <div>
      {label && <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-2">{label}</p>}
      <canvas ref={ref} width={640} height={220} style={{ width: "100%", height: "220px" }} />
    </div>
  );
}

// ── Horizontal bar chart ──────────────────────────────────────────────────────
function HBarChart({ products }: { products: TopProduct[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas || !products.length) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const w = canvas.width; const h = canvas.height;
    const barH = 28; const gap = 10; const labelW = 160; const pad = 20;
    ctx.clearRect(0, 0, w, h);
    const maxVal = Math.max(...products.map(p => p.total_revenue));
    products.slice(0, 8).forEach((p, i) => {
      const y = pad + i * (barH + gap);
      const barW = ((p.total_revenue / maxVal) * (w - labelW - pad * 2 - 60));
      // Label
      ctx.fillStyle = "#5A4E42"; ctx.font = "11px DM Sans, sans-serif"; ctx.textAlign = "right";
      const name = p.name.length > 22 ? p.name.slice(0, 22) + "..." : p.name;
      ctx.fillText(name, labelW, y + barH / 2 + 4);
      // Track
      ctx.fillStyle = "#f2ede4";
      ctx.beginPath(); ctx.roundRect(labelW + 10, y, w - labelW - pad - 70, barH, 3); ctx.fill();
      // Bar
      const grad = ctx.createLinearGradient(labelW + 10, 0, labelW + 10 + barW, 0);
      grad.addColorStop(0, "#6A9457"); grad.addColorStop(1, "#4E7040");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(labelW + 10, y, barW, barH, 3); ctx.fill();
      // Value
      ctx.fillStyle = "#1A1510"; ctx.font = "bold 11px DM Sans, sans-serif"; ctx.textAlign = "left";
      ctx.fillText("Rs." + Math.round(p.total_revenue / 1000) + "k", labelW + barW + 16, y + barH / 2 + 4);
    });
  }, [products]);
  const h = Math.max(80, products.slice(0, 8).length * 38 + 40);
  return <canvas ref={ref} width={640} height={h} style={{ width: "100%", height: h + "px" }} />;
}

export default function AdminAnalyticsPage() {
  const { data: summary } = useQuery<Summary>({
    queryKey: ["admin-summary"],
    queryFn: async () => (await apiClient.get("/admin/analytics/summary")).data,
  });
  const { data: revenueData = [] } = useQuery<RevenuePoint[]>({
    queryKey: ["admin-revenue-chart"],
    queryFn: async () => (await apiClient.get("/admin/analytics/revenue-chart")).data,
  });
  const { data: topProducts = [] } = useQuery<TopProduct[]>({
    queryKey: ["admin-top-products"],
    queryFn: async () => (await apiClient.get("/admin/analytics/top-products?limit=10")).data,
  });

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = revenueData.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const bestDay = revenueData.reduce((best, d) => d.revenue > best.revenue ? d : best, revenueData[0] || { date: "", revenue: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium text-[var(--text-primary)]">Analytics</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Last 30 days performance</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue (30d)", value: "Rs." + (totalRevenue / 1000).toFixed(1) + "k" },
          { label: "Orders (30d)", value: totalOrders },
          { label: "Avg Order Value", value: "Rs." + avgOrderValue.toFixed(0) },
          { label: "Best Day", value: bestDay?.date ? new Date(bestDay.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded border border-[var(--border-light)] p-5">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">{k.label}</p>
            <p className="font-display text-2xl font-medium text-[var(--text-primary)]">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue line chart */}
      <div className="bg-white rounded border border-[var(--border-light)] p-5">
        <h2 className="font-display text-xl font-medium text-[var(--text-primary)] mb-5">Daily Revenue</h2>
        {revenueData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-[var(--text-muted)] text-sm">
            No revenue data yet.
          </div>
        ) : (
          <LineChart data={revenueData} field="revenue" color="#6A9457" />
        )}
      </div>

      {/* Orders chart */}
      <div className="bg-white rounded border border-[var(--border-light)] p-5">
        <h2 className="font-display text-xl font-medium text-[var(--text-primary)] mb-5">Daily Orders</h2>
        {revenueData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-[var(--text-muted)] text-sm">No order data yet.</div>
        ) : (
          <LineChart data={revenueData} field="orders" color="#3B5BDB" />
        )}
      </div>

      {/* Top products */}
      <div className="bg-white rounded border border-[var(--border-light)] p-5">
        <h2 className="font-display text-xl font-medium text-[var(--text-primary)] mb-5">
          Revenue by Product
        </h2>
        {topProducts.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-[var(--text-muted)] text-sm">No sales data yet.</div>
        ) : (
          <HBarChart products={topProducts} />
        )}
      </div>

      {/* Summary table */}
      <div className="bg-white rounded border border-[var(--border-light)] p-5">
        <h2 className="font-display text-xl font-medium text-[var(--text-primary)] mb-4">Top Products Detail</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-light)]">
              {["Product", "Units Sold", "Revenue", "Avg Price"].map(h => (
                <th key={h} className="text-left text-xs uppercase tracking-wider text-[var(--text-muted)] py-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p, i) => (
              <tr key={i} className="border-b border-[var(--border-light)] last:border-0">
                <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{p.name}</td>
                <td className="py-3 pr-4 text-[var(--text-secondary)]">{p.total_sold}</td>
                <td className="py-3 pr-4 font-semibold text-[var(--sage-700)]">
                  Rs.{parseFloat(String(p.total_revenue)).toFixed(0)}
                </td>
                <td className="py-3 text-[var(--text-secondary)]">
                  Rs.{p.total_sold > 0 ? (parseFloat(String(p.total_revenue)) / p.total_sold).toFixed(0) : 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}