"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ClipboardList,
  Lightbulb,
  Lock,
  Package,
  Pill,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURE_ITEMS = [
  {
    icon: ClipboardList,
    title: "Forecast discipline",
    description: "Track the next eight months of demand and keep planning assumptions visible.",
  },
  {
    icon: TrendingUp,
    title: "Risk visibility",
    description: "Spot low stock, critical coverage, and stockout pressure before it becomes urgent.",
  },
  {
    icon: Package,
    title: "PO follow-through",
    description: "Keep open orders, value, and arrival timing in the same operating view.",
  },
];

const TRUST_MARKERS = [
  { label: "PIN secured", value: "6 digits" },
  { label: "Planning view", value: "8 months" },
  { label: "PO focus", value: "Live" },
];

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
    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    setDigits(nextDigits);
    setError("");

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (cleaned && index === 5) {
      const pin = nextDigits.join("");
      if (pin.length === 6) {
        void submitPin(pin);
      }
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const nextDigits = pasted.split("");
      setDigits(nextDigits);
      inputRefs.current[5]?.focus();
      void submitPin(pasted);
    }
  }

  async function submitPin(pin: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      const data = await response.json();
      setError(data.error ?? "Invalid PIN");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setError("Connection error. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const pin = digits.join("");
    if (pin.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    await submitPin(pin);
  }

  const pinComplete = digits.every((digit) => digit !== "");

  return (
    <main id="main-content" className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh max-w-[1680px] lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
        <section className="relative hidden overflow-hidden border-r border-border/70 px-8 py-8 lg:flex">
          <div className="panel-surface relative flex h-full w-full flex-col rounded-[36px] border-sidebar-border/70 bg-sidebar/95 px-8 py-8 text-sidebar-foreground shadow-[0_38px_90px_-40px_rgba(2,6,23,0.82)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(3,105,161,0.20),transparent_22rem),radial-gradient(circle_at_bottom_right,rgba(2,132,199,0.15),transparent_20rem)]" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-sidebar-primary shadow-[0_20px_36px_-24px_rgba(3,105,161,0.85)]">
                <Pill className="size-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/45">
                  ICT-PO
                </p>
                <p className="mt-1 text-lg font-semibold text-sidebar-foreground">
                  Sale-Stock control room
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-12 max-w-xl space-y-5">
              <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/68">
                Secure operational access
              </span>
              <div className="space-y-4">
                <h1 className="text-balance text-4xl font-semibold leading-tight tracking-[-0.04em] text-sidebar-foreground">
                  Start the day with one clean view of demand, stock, and purchase commitments.
                </h1>
                <p className="max-w-lg text-sm leading-7 text-sidebar-foreground/66">
                  The app is designed for fast decision-making on pharmaceutical inventory. Sign in with
                  your team PIN to continue where the planning run left off.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
              {TRUST_MARKERS.map((marker) => (
                <div
                  key={marker.label}
                  className="rounded-[24px] border border-white/8 bg-white/6 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                >
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/42">
                    {marker.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-sidebar-foreground">
                    {marker.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-auto grid gap-3">
              {FEATURE_ITEMS.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-[26px] border border-white/8 bg-white/6 px-5 py-5"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                      <Icon className="size-5 text-sidebar-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-sidebar-foreground">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-sidebar-foreground/62">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary shadow-[0_18px_36px_-24px_rgba(3,105,161,0.7)]">
                <Pill className="size-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  ICT-PO
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">Sale-Stock control room</p>
              </div>
            </div>

            <div className="panel-surface rounded-[32px] px-6 py-6 sm:px-8 sm:py-8">
              <div className="space-y-5">
                <div className="inline-flex size-14 items-center justify-center rounded-[24px] bg-primary/10 text-primary">
                  <Lock className="size-6" />
                </div>

                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-border/80 bg-background/70 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Secure access
                  </span>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
                      Welcome back
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Enter the team PIN to unlock planning, stock risk, and purchase order workflows.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {TRUST_MARKERS.map((marker) => (
                    <div
                      key={marker.label}
                      className="rounded-[22px] border border-border/80 bg-background/65 px-3 py-3"
                    >
                      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {marker.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{marker.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-foreground" htmlFor="pin-digit-1">
                      Team PIN
                    </label>
                    <span className="text-xs text-muted-foreground">Auto-submits on digit six</span>
                  </div>

                  <div className="flex gap-2.5" onPaste={handlePaste}>
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        id={index === 0 ? "pin-digit-1" : undefined}
                        ref={(element) => {
                          inputRefs.current[index] = element;
                        }}
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digit}
                        onChange={(event) => handleDigitChange(index, event.target.value)}
                        onKeyDown={(event) => handleKeyDown(index, event)}
                        disabled={loading}
                        aria-label={`PIN digit ${index + 1}`}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? "pin-error" : undefined}
                        className={cn(
                          "h-14 w-full rounded-[22px] border border-border/80 bg-background/78 text-center text-xl font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-all outline-none",
                          "focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/12",
                          digit && "border-primary/35 bg-primary/6",
                          error && "border-destructive/45 bg-destructive/5 text-destructive",
                          loading && "cursor-not-allowed opacity-60"
                        )}
                      />
                    ))}
                  </div>

                  {error ? (
                    <p
                      id="pin-error"
                      role="alert"
                      className="rounded-[20px] border border-destructive/18 bg-destructive/6 px-4 py-3 text-sm text-destructive"
                    >
                      {error}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 rounded-[20px] border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                      <ShieldCheck className="size-4 text-primary" />
                      Use the shared 6-digit access PIN provided by your administrator.
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !pinComplete}
                  className="w-full justify-center"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 rounded-full border-2 border-primary-foreground/35 border-t-primary-foreground animate-spin" />
                      Verifying access
                    </span>
                  ) : (
                    <>
                      Enter workspace
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 rounded-[24px] border border-border/80 bg-background/62 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Lightbulb className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Need help with access?</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      If the PIN is lost or expired, contact the system administrator before starting the next planning run.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
