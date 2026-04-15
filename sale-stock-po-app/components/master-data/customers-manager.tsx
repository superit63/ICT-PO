"use client";

import { useDeferredValue, useRef, useState } from "react";
import { Download, PencilLine, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer } from "@/components/master-data/master-data-workspace";
import { exportSheet, readSheetNumber, readSheetRows, readSheetText } from "@/lib/master-data-sheet";

type CustomerForm = { name: string; region: string; notes: string };

const EMPTY_FORM: CustomerForm = { name: "", region: "MB", notes: "" };
const CUSTOMER_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Customer Name" },
  { key: "region", label: "Region" },
  { key: "notes", label: "Notes" },
];

export function CustomersManager({ customers, onRefresh }: { customers: Customer[]; onRefresh: () => Promise<void> }) {
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<CustomerForm>(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredCustomers = customers.filter((customer) => {
    if (!deferredQuery) return true;
    return `${customer.name} ${customer.region} ${customer.notes ?? ""}`.toLowerCase().includes(deferredQuery);
  });

  async function saveCustomer(endpoint: string, method: "POST" | "PUT", payload: CustomerForm) {
    setSaving(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Save failed");
      await onRefresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    await exportSheet({
      rows: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        region: customer.region,
        notes: customer.notes ?? "",
      })),
      columns: CUSTOMER_COLUMNS,
      filename: "customers-master-data.xlsx",
      sheetName: "Customers",
    });
    toast.success("Customer sheet exported");
  }

  async function handleImport(file: File | null) {
    if (!file) return;
    setImporting(true);
    try {
      const rows = await readSheetRows(file);
      const payload = rows
        .map((row) => {
          const id = readSheetNumber(row, ["id", "customerid"]);
          const name = readSheetText(row, ["customername", "name", "customer"]);
          const region = readSheetText(row, ["region", "area"]) || "MB";
          const notes = readSheetText(row, ["notes", "remark", "remarks"]);
          if (!id && !name && !notes) return null;
          return {
            id: id || null,
            name,
            region,
            notes,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      if (payload.length === 0) {
        throw new Error("No customer rows found in the sheet");
      }

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Import failed");
      }

      await onRefresh();
      toast.success(`Imported customers: ${data.created ?? 0} created, ${data.updated ?? 0} updated`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Add Customer</CardTitle>
          <CardDescription>Create the customer records used in forecast planning.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const saved = await saveCustomer("/api/customers", "POST", form);
              if (!saved) return;
              setForm(EMPTY_FORM);
              toast.success("Customer added");
            }}
          >
            <CustomerFields form={form} onChange={setForm} />
            <Button type="submit" disabled={saving} className="gap-1.5">
              <Plus className="size-3.5" />
              {saving ? "Saving..." : "Add customer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>Search, export, or bulk import the customer base used by forecasts.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void handleExport()}>
                <Download className="size-3.5" />
                Export sheet
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={importing}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3.5" />
                {importing ? "Importing..." : "Import sheet"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(event) => void handleImport(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers" className="pl-9" />
          </label>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/55">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Customer</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Region</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Notes</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-secondary/35">
                    <td className="px-3 py-3 font-semibold text-foreground">{customer.name}</td>
                    <td className="px-3 py-3 text-foreground">{customer.region}</td>
                    <td className="px-3 py-3 text-muted-foreground">{customer.notes || "-"}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            setEditing(customer);
                            setEditForm({
                              name: customer.name,
                              region: customer.region,
                              notes: customer.notes ?? "",
                            });
                          }}
                        >
                          <PencilLine className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
                              const data = await response.json();
                              if (!response.ok) throw new Error(data.error ?? "Delete failed");
                              await onRefresh();
                              toast.success(`Deleted ${customer.name}`);
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Delete failed");
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Use notes for planning context such as hospital group or contract remarks.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!editing) return;
              const saved = await saveCustomer(`/api/customers/${editing.id}`, "PUT", editForm);
              if (!saved) return;
              setEditing(null);
              toast.success("Customer updated");
            }}
          >
            <CustomerFields form={editForm} onChange={setEditForm} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerFields({
  form,
  onChange,
}: {
  form: CustomerForm;
  onChange: React.Dispatch<React.SetStateAction<CustomerForm>>;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="customer-name">Customer name</Label>
        <Input id="customer-name" value={form.name} onChange={(event) => onChange((prev) => ({ ...prev, name: event.target.value }))} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="customer-region">Region</Label>
        <Input id="customer-region" value={form.region} onChange={(event) => onChange((prev) => ({ ...prev, region: event.target.value }))} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="customer-notes">Notes</Label>
        <Input id="customer-notes" value={form.notes} onChange={(event) => onChange((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Optional planning context" />
      </div>
    </>
  );
}
