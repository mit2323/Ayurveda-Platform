import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import CartSidebar from "@/components/shop/CartSidebar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            <main className="pt-20 min-h-screen" style={{ background: "var(--cream)" }}>
                {children}
            </main>
            <CartSidebar />
            <Footer />
        </>
    );
}