import ShopLayout from "@/components/layouts/ShopLayout";
import ProductsClient from "./ProductsClient";

export const metadata = {
    title: "Shop — Ayurvedic Products",
    description: "Browse our complete range of authentic Ayurvedic products.",
};

export default function ProductsPage() {
    return (
        <ShopLayout>
            <ProductsClient />
        </ShopLayout>
    );
}