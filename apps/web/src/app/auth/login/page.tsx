"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import apiClient from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";
import type { TokenPair } from "@/types";

const schema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const res = await apiClient.post<TokenPair>("/auth/login", data);
            setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
            toast.success(`Welcome back, ${res.data.user.full_name.split(" ")[0]}!`);
            router.push("/shop/products");
        } catch (err: any) {
            const msg = err.response?.data?.detail || "Invalid email or password";
            toast.error(typeof msg === "string" ? msg : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex"
            style={{ background: "var(--cream)" }}
        >
            {/* Left panel — decorative */}
            <div
                className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16"
                style={{
                    background: "linear-gradient(135deg, var(--sage-800), var(--sage-700))",
                }}
            >
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-[var(--gold-400)] flex items-center justify-center">
                        <span className="text-white font-display font-bold">A</span>
                    </div>
                    <span className="font-display text-xl text-white font-medium">AyurVeda</span>
                </Link>

                <div>
                    <blockquote className="font-display text-3xl text-white leading-relaxed mb-6">
                        &ldquo;The natural healing force within each one of us is the greatest force in getting well.&rdquo;
                    </blockquote>
                    <cite className="text-white/60 text-sm not-italic">— Hippocrates</cite>
                </div>

                <div className="flex gap-4">
                    {["Natural", "Organic", "Authentic", "Ayurvedic"].map((tag) => (
                        <span
                            key={tag}
                            className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/70"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
                        <div className="w-8 h-8 rounded-full bg-[var(--sage-600)] flex items-center justify-center">
                            <span className="text-white font-display font-bold text-sm">A</span>
                        </div>
                        <span className="font-display text-xl font-medium">AyurVeda</span>
                    </Link>

                    <h1 className="font-display text-4xl font-medium text-[var(--text-primary)] mb-2">
                        Welcome back
                    </h1>
                    <p className="text-[var(--text-muted)] mb-8">
                        Sign in to continue your wellness journey.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                                Email address
                            </label>
                            <input
                                {...register("email")}
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="input-field"
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-xs text-[var(--sage-600)] hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="input-field pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign In
                                    <ArrowRight size={16} />
                                </span>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[var(--text-muted)] mt-8">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/register" className="text-[var(--sage-600)] font-medium hover:underline">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}