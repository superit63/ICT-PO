"use client";

import { useCallback, useEffect, useState } from "react";
import { Boxes, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomersManager } from "@/components/master-data/customers-manager";
import { ProductsManager } from "@/components/master-data/products-manager";

export type Product = {
  id: number;
  name: string;
  sku: string;
  exw_price_eur: number;
  packing_per_pallet: number;
};

export type Customer = {
  id: number;
  name: string;
  region: string;
  notes: string | null;
};

export function MasterDataWorkspace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productData, customerData] = await Promise.all([
        fetch("/api/products").then((response) => response.json()),
        fetch("/api/customers").then((response) => response.json()),
      ]);
      setProducts(productData);
      setCustomers(customerData);
    } catch {
      toast.error("Failed to load master data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Master Data</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Maintain the products and customers that feed forecasting, stock, and purchase orders.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Products", value: String(products.length), icon: Boxes },
          { label: "Customers", value: String(customers.length), icon: UsersRound },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} size="sm">
              <CardContent className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{item.value}</p>
                </div>
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <Icon className="size-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="pt-4">
          <ProductsManager products={products} onRefresh={loadData} />
        </TabsContent>
        <TabsContent value="customers" className="pt-4">
          <CustomersManager customers={customers} onRefresh={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
