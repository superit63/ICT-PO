import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { initDb } from "@/lib/init";
import { getPinHashRecord } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await initDb();

  const cookieStore = await cookies();
  const session = cookieStore.get("session_pin");
  const pinHash = await getPinHashRecord();
  if (!pinHash) {
    redirect("/setup");
  }
  if (!session?.value || session.value !== pinHash.value) {
    redirect("/login");
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background lg:flex-row">
      <Sidebar />
      <div className="relative min-w-0 flex-1">
        <div className="shell-grid pointer-events-none absolute inset-0" />
        <main
          id="main-content"
          className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1680px] flex-col px-3 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:min-h-dvh lg:px-6 xl:px-8"
        >
          <section className="panel-surface flex-1 rounded-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
