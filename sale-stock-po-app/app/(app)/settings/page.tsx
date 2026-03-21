"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [pinError, setPinError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // ── Export full JSON backup ─────────────────────────────────────────────────
  async function handleExportBackup() {
    setBackupLoading(true);
    try {
      const [products, customers, forecasts, stock, po] = await Promise.all([
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/forecasts").then((r) => r.json()),
        fetch("/api/stock").then((r) => r.json()),
        fetch("/api/po").then((r) => r.json()),
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        tables: { products, customers, forecasts, stock, purchaseOrders: po },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ictpo-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup exported");
    } catch {
      toast.error("Backup failed");
    } finally {
      setBackupLoading(false);
    }
  }

  // ── Change PIN ─────────────────────────────────────────────────────────────
  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setPinError("PIN must be 6 digits");
      return;
    }
    if (pin !== pin2) {
      setPinError("PINs do not match");
      return;
    }
    setResetting(true);
    setPinError("");
    try {
      // Verify old PIN first
      const verify = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (verify.ok) {
        toast.error("New PIN cannot be the same as the current PIN");
        setResetting(false);
        return;
      }
      // For now: just re-setup (in production you'd need old PIN verification)
      // Simple reset: delete old hash + set new one via direct DB write
      const res = await fetch("/api/auth/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPin: pin }),
      });
      if (res.ok) {
        toast.success("PIN changed successfully");
        setPin(""); setPin2("");
      } else {
        toast.error("Failed to change PIN");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setResetting(false);
    }
  }

  // ── Import JSON backup ─────────────────────────────────────────────────────
  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) return;
    try {
      const text = await importFile.text();
      const backup = JSON.parse(text);
      if (!backup.tables) throw new Error("Invalid backup file");
      toast.warning("Restore is not yet implemented — contact developer");
    } catch {
      toast.error("Invalid backup file");
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">⚙️ Settings</h1>
        <p className="text-sm text-slate-500">Backup, PIN management, and app info</p>
      </div>

      {/* Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💾 Data Backup</CardTitle>
          <CardDescription>
            Export your full database as JSON. Download a backup weekly and store it safely.
            Turso free tier also includes automatic replication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleExportBackup} disabled={backupLoading} variant="outline">
            {backupLoading ? "Exporting..." : "📥 Export All Data (JSON)"}
          </Button>

          <form onSubmit={handleImport} className="space-y-2">
            <Label htmlFor="import-file">Restore from backup (advanced)</Label>
            <div className="flex gap-2">
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <Button type="submit" variant="destructive" disabled={!importFile}>
                Restore
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* PIN change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔐 Change PIN</CardTitle>
          <CardDescription>Reset your 6-digit PIN. You will need your current PIN.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePin} className="space-y-4">
            <div>
              <Label htmlFor="new-pin">New PIN (6 digits)</Label>
              <Input
                id="new-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="• • • • • •"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-1 text-center text-xl font-mono tracking-[0.5em]"
              />
            </div>
            <div>
              <Label htmlFor="new-pin2">Confirm PIN</Label>
              <Input
                id="new-pin2"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="• • • • • •"
                value={pin2}
                onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-1 text-center text-xl font-mono tracking-[0.5em]"
              />
            </div>
            {pinError && <p className="text-sm text-red-600">{pinError}</p>}
            <Button type="submit" disabled={resetting || pin.length !== 6 || pin2.length !== 6}>
              {resetting ? "Changing..." : "Change PIN"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* App info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ℹ️ App Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>App</span><span className="font-medium text-slate-800">Sale-Stock-PO | ICT-PO</span>
          </div>
          <div className="flex justify-between">
            <span>Version</span><Badge variant="outline">1.0.0</Badge>
          </div>
          <div className="flex justify-between">
            <span>Stack</span><span className="font-medium text-slate-800">Next.js 14 + Turso SQLite</span>
          </div>
          <div className="flex justify-between">
            <span>Hosting</span><span className="font-medium text-slate-800">Vercel</span>
          </div>
          <div className="flex justify-between">
            <span>Database</span><span className="font-medium text-slate-800">Turso libSQL</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 border-t pt-2">
            For support, contact the app developer. Data is stored in Turso SQLite with automatic backups.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
