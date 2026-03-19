import { redirect } from "next/navigation";

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  redirect("/shop/orders");
}
