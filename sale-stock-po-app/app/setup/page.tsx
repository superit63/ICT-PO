"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Pill, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits.");
      return;
    }

    if (pin !== confirm) {
      setError("PINs do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/setup", {
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
      setError(data.error ?? "Setup failed.");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main-content" className="min-h-dvh bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1280px] items-center gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
        <section className="panel-surface relative hidden overflow-hidden rounded-[36px] bg-sidebar/95 px-8 py-8 text-sidebar-foreground shadow-[0_38px_90px_-40px_rgba(2,6,23,0.82)] lg:block">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(3,105,161,0.20),transparent_22rem),radial-gradient(circle_at_bottom_right,rgba(2,132,199,0.15),transparent_20rem)]" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-sidebar-primary shadow-[0_20px_36px_-24px_rgba(3,105,161,0.85)]">
              <Pill className="size-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/45">
                ICT-PO
              </p>
              <p className="mt-1 text-lg font-semibold text-sidebar-foreground">Initial setup</p>
            </div>
          </div>

          <div className="relative z-10 mt-10 max-w-xl space-y-4">
            <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/68">
              Secure first access
            </span>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-[-0.04em] text-sidebar-foreground">
              Create the shared PIN that protects planning and purchasing activity.
            </h1>
            <p className="text-sm leading-7 text-sidebar-foreground/66">
              This six-digit PIN becomes the front door to the operational workspace. Keep it memorable for
              the team and store it somewhere secure.
            </p>
          </div>

          <div className="relative z-10 mt-8 grid gap-3">
            {[
              "Exactly 6 numeric digits.",
              "Used every time the app is opened.",
              "Can be changed later in Settings.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/8 bg-white/6 px-5 py-4 text-sm text-sidebar-foreground/72"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="panel-surface rounded-[32px] px-6 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary shadow-[0_18px_36px_-24px_rgba(3,105,161,0.7)]">
              <Pill className="size-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                ICT-PO
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">Initial setup</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="inline-flex size-14 items-center justify-center rounded-[24px] bg-primary/10 text-primary">
              <Lock className="size-6" />
            </div>

            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-border/80 bg-background/70 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Create team PIN
              </span>
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
                  Protect the workspace
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Choose a six-digit PIN that the planning team will use to open the application.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="pin">New PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="6 digits"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-14 text-center text-2xl tracking-[0.45em] font-mono"
                aria-describedby={error ? "setup-pin-error" : undefined}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm PIN</Label>
              <Input
                id="confirm"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="Repeat PIN"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-14 text-center text-2xl tracking-[0.45em] font-mono"
                aria-describedby={error ? "setup-pin-error" : undefined}
              />
            </div>

            {error ? (
              <p
                id="setup-pin-error"
                role="alert"
                className="rounded-[20px] border border-destructive/18 bg-destructive/6 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </p>
            ) : (
              <div className="flex items-start gap-3 rounded-[24px] border border-border/80 bg-background/62 px-4 py-4">
                <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Setup guidance</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Keep the PIN numeric, memorable to the team, and stored securely outside the app.
                  </p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading || pin.length !== 6 || confirm.length !== 6}
              className="w-full justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-primary-foreground/35 border-t-primary-foreground animate-spin" />
                  Creating PIN
                </span>
              ) : (
                <>
                  Save PIN and enter app
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
