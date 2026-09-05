import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <Sidebar />
      <div className="flex min-h-full flex-col lg:pl-64">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
      <MobileNavigation />
    </div>
  );
}
