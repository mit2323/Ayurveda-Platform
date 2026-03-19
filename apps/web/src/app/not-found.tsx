import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <div className="text-center">
        <p className="font-display text-8xl text-[var(--sage-200)] font-medium mb-4">404</p>
        <h2 className="font-display text-3xl text-[var(--text-primary)] mb-3">Page not found</h2>
        <p className="text-[var(--text-muted)] mb-8">The page you are looking for doesn&apos;t exist.</p>
        <Link href="/" className="btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}
