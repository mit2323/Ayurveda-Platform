"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <div className="text-center">
        <h2 className="font-display text-3xl text-[var(--text-primary)] mb-3">Something went wrong</h2>
        <p className="text-[var(--text-muted)] mb-6">{error.message}</p>
        <button onClick={reset} className="btn-primary">Try again</button>
      </div>
    </div>
  );
}
