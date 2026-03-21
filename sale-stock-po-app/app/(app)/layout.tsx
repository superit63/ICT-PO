import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { initDb } from "@/lib/init";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await initDb();

  const cookieStore = await cookies();
  const session = cookieStore.get("session_pin");
  if (!session?.value) {
    redirect("/login");
  }

  const pinHash = await queryOne("SELECT value FROM app_config WHERE key = 'pin_hash'");
  if (!pinHash) {
    redirect("/setup");
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-6 py-6 lg:px-8 max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
