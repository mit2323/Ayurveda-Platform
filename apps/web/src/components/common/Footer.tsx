import Link from "next/link";
import { Instagram, Twitter, Facebook, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
    return (
        <footer style={{ background: "var(--sage-800)", color: "rgba(255,255,255,0.85)" }}>
            {/* Top bar */}
            <div className="border-b border-white/10">
                <div className="container-main py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

                        {/* Brand */}
                        <div className="md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--gold-400)] flex items-center justify-center">
                                    <span className="text-white font-display text-sm font-bold">A</span>
                                </div>
                                <span className="font-display text-xl text-white font-medium">AyurVeda</span>
                            </div>
                            <p className="text-sm leading-relaxed opacity-70">
                                Rooted in ancient wisdom, crafted for modern wellness. Pure Ayurvedic formulations from nature to you.
                            </p>
                            <div className="flex items-center gap-3 mt-6">
                                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                                    <a
                                        key={i}
                                        href="#"
                                        className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:border-[var(--gold-400)] hover:text-[var(--gold-400)] transition-colors"
                                    >
                                        <Icon size={14} />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Shop */}
                        <div>
                            <h4 className="font-display text-lg text-white mb-4">Shop</h4>
                            <ul className="space-y-2 text-sm opacity-70">
                                {["All Products", "Vata Balance", "Pitta Cooling", "Kapha Energize", "Tridosha"].map((item) => (
                                    <li key={item}>
                                        <Link href="/shop/products" className="hover:opacity-100 hover:text-[var(--gold-300)] transition-colors">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Help */}
                        <div>
                            <h4 className="font-display text-lg text-white mb-4">Help</h4>
                            <ul className="space-y-2 text-sm opacity-70">
                                {["My Orders", "Shipping Policy", "Returns", "FAQ", "Privacy Policy"].map((item) => (
                                    <li key={item}>
                                        <Link href="#" className="hover:opacity-100 hover:text-[var(--gold-300)] transition-colors">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-display text-lg text-white mb-4">Contact</h4>
                            <ul className="space-y-3 text-sm opacity-70">
                                <li className="flex items-center gap-2">
                                    <Mail size={14} className="shrink-0" />
                                    <span>hello@ayurveda.in</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Phone size={14} className="shrink-0" />
                                    <span>+91 98765 43210</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <MapPin size={14} className="shrink-0 mt-0.5" />
                                    <span>Pune, Maharashtra, India</span>
                                </li>
                            </ul>

                            {/* Newsletter */}
                            <div className="mt-6">
                                <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Newsletter</p>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="flex-1 bg-white/10 border border-white/20 rounded-sm px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-[var(--gold-400)] transition-colors"
                                    />
                                    <button className="btn-gold px-4 py-2 text-xs">Join</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="container-main py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs opacity-50">
                    <p>© 2025 AyurVeda Platform. All rights reserved.</p>
                    <p>Made with care in India 🌿</p>
                </div>
            </div>
        </footer>
    );
}