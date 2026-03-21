import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { initDb } from "@/lib/init";
import { Nav } from "@/components/layout/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Ensure DB schema exists
  await initDb();

  // Check PIN session
  const cookieStore = await cookies();
  const session = cookieStore.get("session_pin");
  if (!session?.value) {
    redirect("/login");
  }

  // Check if PIN is set up
  const pinHash = await queryOne("SELECT value FROM app_config WHERE key = 'pin_hash'");
  if (!pinHash) {
    redirect("/setup");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
