"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pill, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleDigitChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    setError("");

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (cleaned && index === 5) {
      const pin = [...newDigits.slice(0, 5), cleaned].join("");
      if (pin.length === 6) {
        submitPin(pin);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split("");
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
      submitPin(pasted);
    }
  }

  async function submitPin(pin: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Invalid PIN");
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError("Connection error. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pin = digits.join("");
    if (pin.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    await submitPin(pin);
  }

  const pinComplete = digits.every((d) => d !== "");

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex flex-col w-[420px] bg-sidebar text-sidebar-foreground p-10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-black/20 pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <Pill className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sidebar-foreground text-sm">ICT Sale-Stock-PO</p>
              <p className="text-xs text-sidebar-foreground/50">Pharmaceutical Inventory</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-sidebar-foreground mb-4 leading-tight">
              Manage your inventory with confidence
            </h2>
            <p className="text-sidebar-foreground/60 text-sm leading-relaxed">
              8-month stock projections, intelligent purchase order suggestions,
              and real-time stockout alerts — all in one place.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { label: "8-Month Rolling Forecast", desc: "Forward-looking inventory visibility" },
                { label: "Auto PO Suggestions", desc: "Critical & warning level detection" },
                { label: "Full PO Lifecycle", desc: "Order to receipt tracking" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-sidebar-foreground">{item.label}</p>
                    <p className="text-xs text-sidebar-foreground/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-sidebar-foreground/30">
            Secured with PIN authentication
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Pill className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">ICT Sale-Stock-PO</span>
          </div>

          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your 6-digit PIN to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="text-sm font-medium text-foreground mb-3">PIN Code</p>
              <div className="flex gap-2.5 justify-between" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={loading}
                    className={cn(
                      "w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background transition-all duration-150 outline-none",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20",
                      digit ? "border-primary/60 bg-primary/5" : "border-border",
                      error ? "border-destructive/60 bg-destructive/5 animate-shake" : "",
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    )}
                    aria-label={`PIN digit ${i + 1}`}
                  />
                ))}
              </div>
              {error && (
                <p className="text-sm text-destructive mt-2.5 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-destructive inline-block" />
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !pinComplete}
              className={cn(
                "w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150",
                pinComplete && !loading
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Verifying...
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Forgot your PIN? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
