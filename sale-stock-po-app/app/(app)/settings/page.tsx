"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Database, Lock, Info, Download, Upload, Settings,
} from "lucide-react";

export default function SettingsPage() {
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [pinError, setPinError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

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
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Backup, PIN management, and app info</p>
      </div>

      {/* Backup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Data Backup
          </CardTitle>
          <CardDescription>
            Export your full database as JSON. Download a backup weekly and store it safely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleExportBackup} disabled={backupLoading} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            {backupLoading ? "Exporting..." : "Export All Data (JSON)"}
          </Button>

          <div className="border-t border-border pt-4">
            <form onSubmit={handleImport} className="space-y-2">
              <Label htmlFor="import-file" className="text-sm font-medium">Restore from backup (advanced)</Label>
              <div className="flex gap-2">
                <Input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                <Button type="submit" variant="outline" disabled className="gap-2 shrink-0">
                  <Upload className="w-4 h-4" />
                  Restore (coming soon)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Restore remains disabled until the import flow is implemented safely end-to-end.
              </p>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* PIN change */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Change PIN
          </CardTitle>
          <CardDescription>Reset your 6-digit access PIN.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePin} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
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
                  className="text-center text-xl font-mono tracking-[0.5em]"
                />
              </div>
              <div className="space-y-1.5">
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
                  className="text-center text-xl font-mono tracking-[0.5em]"
                />
              </div>
            </div>
            {pinError && <p className="text-sm text-destructive">{pinError}</p>}
            <Button
              type="submit"
              size="sm"
              disabled={resetting || pin.length !== 6 || pin2.length !== 6}
            >
              {resetting ? "Changing..." : "Change PIN"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* App info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            App Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          {[
            { label: "App", value: "Sale-Stock-PO | ICT-PO" },
            { label: "Version", badge: "1.0.0" },
            { label: "Stack", value: "Next.js 16 + Turso SQLite" },
            { label: "Hosting", value: "Vercel" },
            { label: "Database", value: "Turso libSQL" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
              <span className="text-muted-foreground">{row.label}</span>
              {row.badge ? (
                <Badge variant="outline">{row.badge}</Badge>
              ) : (
                <span className="font-medium text-foreground">{row.value}</span>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            For support, contact the app developer. Data is stored in Turso SQLite with automatic backups.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
