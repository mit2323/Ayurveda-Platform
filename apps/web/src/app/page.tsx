import dynamic from "next/dynamic";
import Link from "next/link";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { ArrowRight, Leaf, Shield, Truck, Star } from "lucide-react";

// Load Three.js scene client-side only
const HerbScene3D = dynamic(() => import("@/components/common/HerbScene3D"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center">
            <div className="skeleton w-full h-full" style={{ minHeight: "500px" }} />
        </div>
    ),
});

const FEATURES = [
    {
        icon: Leaf,
        title: "100% Organic",
        desc: "Sustainably sourced herbs from certified organic farms across India.",
    },
    {
        icon: Shield,
        title: "GMP Certified",
        desc: "Every batch tested for purity, potency, and safety.",
    },
    {
        icon: Truck,
        title: "Free Shipping",
        desc: "Complimentary delivery on all orders above ₹500.",
    },
    {
        icon: Star,
        title: "Expert Curated",
        desc: "Formulated by Ayurvedic physicians with decades of experience.",
    },
];

const DOSHAS = [
    {
        name: "Vata",
        subtitle: "Air & Space",
        color: "#E8F0FF",
        accent: "#3B5BDB",
        desc: "Grounding herbs for calm, focus & nervous system support.",
        href: "/shop/products?dosha_type=vata",
    },
    {
        name: "Pitta",
        subtitle: "Fire & Water",
        color: "#FFF3E0",
        accent: "#E65100",
        desc: "Cooling botanicals that balance heat, inflammation & digestion.",
        href: "/shop/products?dosha_type=pitta",
    },
    {
        name: "Kapha",
        subtitle: "Earth & Water",
        color: "#E8F5E9",
        accent: "#2E7D32",
        desc: "Invigorating herbs for energy, lightness & circulation.",
        href: "/shop/products?dosha_type=kapha",
    },
];

const TESTIMONIALS = [
    {
        name: "Priya Sharma",
        location: "Mumbai",
        rating: 5,
        text: "The Ashwagandha capsules have transformed my sleep quality. I feel calmer and more energised than ever.",
    },
    {
        name: "Rahul Mehta",
        location: "Bangalore",
        rating: 5,
        text: "Finally an Ayurvedic brand that feels premium. The packaging, quality, and results are all exceptional.",
    },
    {
        name: "Ananya Iyer",
        location: "Chennai",
        rating: 5,
        text: "I took the dosha quiz and the recommendations were spot on. My digestion has improved dramatically.",
    },
];

export default function HomePage() {
    return (
        <main>
            <Navbar />

            {/* ── HERO ─────────────────────────────────────────────────────────── */}
            <section
                className="relative min-h-screen flex items-center overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, var(--sage-800) 0%, var(--sage-700) 40%, var(--earth-700) 100%)",
                }}
            >
                {/* Botanical background texture */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%),
                              radial-gradient(circle at 80% 20%, rgba(212,168,67,0.2) 0%, transparent 50%)`,
                    }}
                />

                <div className="container-main relative z-10 pt-24 pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">

                        {/* Left — copy */}
                        <div className="text-white">
                            <div className="flex items-center gap-2 mb-6 animate-fade-up stagger-1">
                                <div className="section-divider" style={{ background: "linear-gradient(to right, var(--gold-400), transparent)" }} />
                                <span className="text-xs uppercase tracking-[0.2em] text-[var(--gold-300)] font-medium">
                                    Ancient Wisdom · Modern Wellness
                                </span>
                            </div>

                            <h1
                                className="font-display font-medium text-white leading-tight mb-6 animate-fade-up stagger-2"
                                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.2)" }}
                            >
                                Heal from
                                <br />
                                <em className="text-[var(--gold-300)]">within</em>
                            </h1>

                            <p className="text-lg text-white/75 leading-relaxed mb-10 max-w-lg animate-fade-up stagger-3">
                                Discover the transformative power of authentic Ayurveda. Pure herbs, ancient formulations,
                                and personalised wellness — crafted for the modern soul.
                            </p>

                            <div className="flex flex-wrap gap-4 animate-fade-up stagger-4">
                                <Link href="/shop/products" className="btn-gold">
                                    Explore Products
                                    <ArrowRight size={16} />
                                </Link>
                                <Link href="#dosha-quiz" className="btn-outline" style={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff" }}>
                                    Find Your Dosha
                                </Link>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-6 mt-14 pt-10 border-t border-white/15 animate-fade-up stagger-5">
                                {[
                                    { num: "200+", label: "Herb Formulas" },
                                    { num: "50K+", label: "Happy Customers" },
                                    { num: "15+", label: "Years Expertise" },
                                ].map((s) => (
                                    <div key={s.label}>
                                        <div className="font-display text-3xl text-[var(--gold-300)] font-medium">{s.num}</div>
                                        <div className="text-xs text-white/60 uppercase tracking-wider mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — 3D scene */}
                        <div
                            className="relative h-[500px] lg:h-[620px] animate-fade-in stagger-2"
                            style={{ filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.3))" }}
                        >
                            <HerbScene3D />
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
                    <span className="text-xs tracking-widest uppercase">Scroll</span>
                    <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
                </div>
            </section>

            {/* ── FEATURES STRIP ───────────────────────────────────────────────── */}
            <section style={{ background: "var(--earth-100)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                <div className="container-main py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {FEATURES.map((f, i) => (
                            <div key={f.title} className="flex items-start gap-4">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: "var(--sage-100)" }}
                                >
                                    <f.icon size={18} color="var(--sage-600)" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[var(--text-primary)] mb-1">{f.title}</h4>
                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── DOSHA SECTION ────────────────────────────────────────────────── */}
            <section id="dosha-quiz" className="py-24" style={{ background: "var(--cream)" }}>
                <div className="container-main">
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="section-divider mx-auto" />
                        </div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage-600)] font-medium mb-4">
                            Personalised Wellness
                        </p>
                        <h2 className="font-display text-[var(--text-primary)] mb-4">
                            Shop by your Dosha
                        </h2>
                        <p className="text-[var(--text-muted)] max-w-xl mx-auto">
                            In Ayurveda, your constitution — or dosha — determines the perfect herbs and formulas for your unique needs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {DOSHAS.map((d) => (
                            <Link
                                key={d.name}
                                href={d.href}
                                className="group relative overflow-hidden rounded border border-[var(--border-light)] p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                style={{ background: d.color }}
                            >
                                <div
                                    className="absolute top-0 left-0 w-1 h-full"
                                    style={{ background: d.accent }}
                                />
                                <p
                                    className="text-xs uppercase tracking-[0.15em] font-medium mb-1"
                                    style={{ color: d.accent }}
                                >
                                    {d.subtitle}
                                </p>
                                <h3
                                    className="font-display text-4xl font-medium mb-3"
                                    style={{ color: d.accent }}
                                >
                                    {d.name}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">{d.desc}</p>
                                <div
                                    className="flex items-center gap-2 text-sm font-medium"
                                    style={{ color: d.accent }}
                                >
                                    Explore {d.name}
                                    <ArrowRight
                                        size={14}
                                        className="transition-transform group-hover:translate-x-1"
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Quiz CTA */}
                    <div
                        className="mt-12 rounded p-8 text-center"
                        style={{
                            background: "linear-gradient(135deg, var(--sage-700), var(--sage-800))",
                            color: "#fff",
                        }}
                    >
                        <h3 className="font-display text-2xl text-white mb-2">
                            Not sure which dosha you are?
                        </h3>
                        <p className="text-white/70 mb-6 text-sm">
                            Take our 2-minute quiz to discover your Ayurvedic constitution and get personalised product recommendations.
                        </p>
                        <Link href="/quiz" className="btn-gold">
                            Take the Dosha Quiz
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
            <section style={{ background: "var(--cream-dark)" }} className="py-24">
                <div className="container-main">
                    <div className="text-center mb-16">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--sage-600)] font-medium mb-4">
                            Customer Stories
                        </p>
                        <h2 className="font-display text-[var(--text-primary)]">
                            Trusted by thousands
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t) => (
                            <div
                                key={t.name}
                                className="bg-white rounded p-6 border border-[var(--border-light)]"
                                style={{ boxShadow: "var(--shadow-soft)" }}
                            >
                                <div className="flex gap-0.5 mb-4">
                                    {Array.from({ length: t.rating }).map((_, i) => (
                                        <Star key={i} size={14} className="star-filled fill-current" />
                                    ))}
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 italic">
                                    &ldquo;{t.text}&rdquo;
                                </p>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center font-display font-medium text-sm"
                                        style={{ background: "var(--sage-100)", color: "var(--sage-700)" }}
                                    >
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text-primary)]">{t.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{t.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
            <section
                className="py-24 text-center"
                style={{
                    background: "linear-gradient(135deg, var(--earth-100), var(--cream))",
                    borderTop: "1px solid var(--border)",
                }}
            >
                <div className="container-main max-w-2xl mx-auto">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold-600)] font-medium mb-4">
                        Begin Your Journey
                    </p>
                    <h2 className="font-display text-[var(--text-primary)] mb-4">
                        Nature&apos;s pharmacy,<br />
                        <em className="text-[var(--sage-600)]">delivered to you</em>
                    </h2>
                    <p className="text-[var(--text-muted)] mb-10">
                        Over 200 authentic Ayurvedic formulations, carefully crafted and ready to support your wellness journey.
                    </p>
                    <Link href="/shop/products" className="btn-primary">
                        Shop All Products
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}