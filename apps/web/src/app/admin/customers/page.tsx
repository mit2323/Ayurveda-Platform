"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserX, ShieldCheck, Eye } from "lucide-react";
import apiClient from "@/lib/axios";
import toast from "react-hot-toast";

interface User {
    id: number;
    email: string;
    full_name: string;
    phone: string | null;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
}

export default function AdminCustomersPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const { data: users = [], isLoading } = useQuery<User[]>({
        queryKey: ["admin-users", page],
        queryFn: async () => (await apiClient.get(`/admin/users?page=${page}&page_size=30`)).data,
    });

    const deactivate = useMutation({
        mutationFn: (id: number) => apiClient.patch(`/admin/users/${id}/deactivate`),
        onSuccess: () => {
            toast.success("User deactivated");
            qc.invalidateQueries({ queryKey: ["admin-users"] });
        },
    });

    const filtered = users.filter(u =>
        !search ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-medium text-[var(--text-primary)]">Customers</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">{filtered.length} registered users</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email..." className="input-field pl-9" />
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Customers", value: users.filter(u => u.role === "customer").length },
                    { label: "Active", value: users.filter(u => u.is_active).length },
                    { label: "Verified", value: users.filter(u => u.is_verified).length },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded border border-[var(--border-light)] p-4 text-center">
                        <p className="font-display text-2xl font-medium text-[var(--text-primary)]">{s.value}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wide">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded border border-[var(--border-light)] overflow-hidden">
                <table className="w-full text-sm">
                    <thead style={{ background: "var(--cream)" }}>
                        <tr className="border-b border-[var(--border-light)]">
                            {["Customer", "Email", "Phone", "Role", "Joined", "Status", "Actions"].map(h => (
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
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">No customers found.</td>
                            </tr>
                        ) : (
                            filtered.map(user => (
                                <tr key={user.id} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--cream)] transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                                style={{ background: "var(--sage-100)", color: "var(--sage-700)" }}>
                                                {user.full_name[0].toUpperCase()}
                                            </div>
                                            <span className="font-medium text-[var(--text-primary)]">{user.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[var(--text-muted)]">{user.email}</td>
                                    <td className="px-4 py-3 text-[var(--text-muted)]">{user.phone || "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${user.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-[var(--cream-dark)] text-[var(--text-muted)]"
                                            }`}>{user.role}</span>
                                    </td>
                                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                                        {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${user.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </span>
                                            {user.is_verified && <ShieldCheck size={13} color="var(--sage-600)" />}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.is_active && user.role === "customer" && (
                                            <button onClick={() => {
                                                if (confirm("Deactivate " + user.full_name + "?")) deactivate.mutate(user.id);
                                            }} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors">
                                                <UserX size={13} />
                                                Deactivate
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}