export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[var(--sage-200)] border-t-[var(--sage-600)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-muted)] font-medium tracking-wide uppercase">Loading...</p>
      </div>
    </div>
  );
}
