"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import apiClient from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";
import type { TokenPair } from "@/types";

const schema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number"),
    phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const BENEFITS = [
    "Personalised Dosha recommendations",
    "Order tracking & history",
    "Exclusive member discounts",
    "Early access to new products",
];

export default function RegisterPage() {
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
            const payload: any = {
                full_name: data.full_name,
                email: data.email,
                password: data.password,
            };
            if (data.phone && data.phone.trim().length >= 7) {
                payload.phone = data.phone;
            }
            const res = await apiClient.post<TokenPair>("/auth/register", payload);

            setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
            toast.success("Welcome to AyurVeda!");
            router.push("/shop/products");
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const msg = typeof detail === "string" ? detail : "Registration failed. Please try again.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: "var(--cream)" }}>
            {/* Left panel */}
            <div
                className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16"
                style={{ background: "linear-gradient(135deg, var(--earth-700), var(--sage-800))" }}
            >
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-[var(--gold-400)] flex items-center justify-center">
                        <span className="text-white font-display font-bold">A</span>
                    </div>
                    <span className="font-display text-xl text-white font-medium">AyurVeda</span>
                </Link>

                <div>
                    <h2 className="font-display text-3xl text-white mb-6">
                        Join thousands who&apos;ve discovered their wellness path
                    </h2>
                    <ul className="space-y-3">
                        {BENEFITS.map((b) => (
                            <li key={b} className="flex items-center gap-3 text-white/80 text-sm">
                                <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: "var(--gold-400)" }}
                                >
                                    <Check size={11} color="#fff" />
                                </div>
                                {b}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-white/40 text-xs">
                    By creating an account you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-md">
                    <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
                        <div className="w-8 h-8 rounded-full bg-[var(--sage-600)] flex items-center justify-center">
                            <span className="text-white font-display font-bold text-sm">A</span>
                        </div>
                        <span className="font-display text-xl font-medium">AyurVeda</span>
                    </Link>

                    <h1 className="font-display text-4xl font-medium text-[var(--text-primary)] mb-2">
                        Create account
                    </h1>
                    <p className="text-[var(--text-muted)] mb-8">Begin your Ayurvedic wellness journey today.</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Full Name</label>
                            <input {...register("full_name")} placeholder="Your full name" className="input-field" />
                            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Email Address</label>
                            <input {...register("email")} type="email" placeholder="you@example.com" className="input-field" />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Phone (optional)</label>
                            <input {...register("phone")} type="tel" placeholder="+91 98765 43210" className="input-field" />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                                    className="input-field pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Create Account
                                    <ArrowRight size={16} />
                                </span>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[var(--text-muted)] mt-8">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-[var(--sage-600)] font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}