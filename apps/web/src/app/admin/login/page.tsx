"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Shield, ArrowRight } from "lucide-react";
import apiClient from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";
import type { TokenPair } from "@/types";

const schema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const res = await apiClient.post<TokenPair>("/auth/login", data);
            if (res.data.user.role !== "admin" && res.data.user.role !== "superadmin") {
                toast.error("Access denied. Admin credentials required.");
                return;
            }
            setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
            toast.success("Welcome back, " + res.data.user.full_name.split(" ")[0] + "!");
            router.push("/admin/dashboard");
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "linear-gradient(135deg, #1a1510 0%, #243818 50%, #1a1510 100%)" }}>

            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: "radial-gradient(circle at 25% 25%, #6A9457 0%, transparent 50%), radial-gradient(circle at 75% 75%, #D4A843 0%, transparent 50%)" }} />

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-sm p-10" style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.4)" }}>
                    {/* Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #4E7040, #243818)" }}>
                            <Shield size={28} color="#fff" />
                        </div>
                    </div>

                    <h1 className="font-display text-3xl font-medium text-[var(--text-primary)] text-center mb-1">
                        Admin Portal
                    </h1>
                    <p className="text-center text-sm text-[var(--text-muted)] mb-8">
                        AyurVeda Platform Administration
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                                Admin Email
                            </label>
                            <input {...register("email")} type="email" placeholder="admin@ayurveda.com"
                                className="input-field" autoComplete="email" />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input {...register("password")} type={showPw ? "text" : "password"}
                                    placeholder="Enter admin password" className="input-field pr-10" autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 font-medium text-sm uppercase tracking-wide text-white rounded-sm transition-all"
                            style={{ background: loading ? "var(--sage-400)" : "var(--sage-700)" }}>
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Access Dashboard
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-[var(--border-light)] text-center">
                        <p className="text-xs text-[var(--text-muted)]">
                            Customer account?{" "}
                            <a href="/auth/login" className="text-[var(--sage-600)] hover:underline">Sign in here</a>
                        </p>
                    </div>
                </div>

                <p className="text-center text-white/30 text-xs mt-6">
                    AyurVeda Platform v1.0 — Restricted Access
                </p>
            </div>
        </div>
    );
}