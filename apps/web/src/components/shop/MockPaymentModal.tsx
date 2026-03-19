"use client";
import { useState, useEffect } from "react";
import { Shield, Check } from "lucide-react";

interface Props {
  amount: number;
  orderNumber: string;
  onSuccess: (paymentId: string) => void;
  onDismiss: () => void;
}

export default function MockPaymentModal({ amount, orderNumber, onSuccess, onDismiss }: Props) {
  const [step, setStep] = useState<"form" | "otp" | "processing" | "success">("form");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (step !== "processing") return;
    const t = setTimeout(() => setStep("success"), 2000);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== "success") return;
    const t = setTimeout(() => {
      onSuccess("pay_" + Math.random().toString(36).slice(2, 14).toUpperCase());
    }, 1500);
    return () => clearTimeout(t);
  }, [step, onSuccess]);

  const handleContinue = () => {
    setError("");
    if (step === "form") { setStep("otp"); return; }
    if (step === "otp") {
      if (otp.length < 4) { setError("Enter any 4-digit OTP. Use 1234 for testing."); return; }
      setStep("processing");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-lg overflow-hidden"
        style={{ boxShadow: "0 30px 100px rgba(0,0,0,0.4)" }}>

        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #4E7040, #365028)" }}>
          <div>
            <p className="text-white font-semibold text-sm">AyurVeda Secure Checkout</p>
            <p className="text-white/60 text-xs">Order #{orderNumber}</p>
          </div>
          <p className="text-white font-bold text-xl">Rs.{amount.toFixed(0)}</p>
        </div>

        {step === "processing" && (
          <div className="px-6 py-14 text-center">
            <div className="w-12 h-12 border-2 border-[var(--sage-200)] border-t-[var(--sage-600)] rounded-full animate-spin mx-auto mb-5" />
            <p className="font-medium text-[var(--text-primary)]">Processing payment...</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Please do not close this window</p>
          </div>
        )}

        {step === "success" && (
          <div className="px-6 py-14 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "#E8F5E9" }}>
              <Check size={28} color="#2E7D32" />
            </div>
            <p className="font-display text-xl font-medium text-[var(--text-primary)]">Payment Successful!</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Confirming your order...</p>
          </div>
        )}

        {step === "form" && (
          <div className="p-5 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
              Demo mode. No real money charged. Click Continue to proceed.
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">Payment Method</label>
              <div className="input-field text-[var(--text-muted)] bg-[var(--cream)]">Any card / UPI / Net Banking</div>
            </div>
            <button onClick={handleContinue}
              className="w-full py-3.5 font-semibold text-white rounded-sm flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #4E7040, #365028)" }}>
              <Shield size={14} />
              Continue to Pay Rs.{amount.toFixed(0)}
            </button>
            <button onClick={onDismiss}
              className="w-full py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Cancel
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="p-5 space-y-4">
            <div className="text-center py-2">
              <p className="font-medium text-[var(--text-primary)]">OTP Verification</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Enter OTP sent to your mobile</p>
            </div>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter OTP"
              maxLength={6}
              className="input-field text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
            <p className="text-center text-xs text-[var(--text-muted)]">Test OTP: <strong>1234</strong></p>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
            <button onClick={handleContinue}
              className="w-full py-3.5 font-semibold text-white rounded-sm flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #4E7040, #365028)" }}>
              <Shield size={14} />
              Verify and Pay Rs.{amount.toFixed(0)}
            </button>
            <button onClick={onDismiss}
              className="w-full py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}