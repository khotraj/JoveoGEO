import { TopBar } from "@/components/shell/TopBar";
import { MasterNav } from "@/components/shell/MasterNav";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <TopBar />
      <MasterNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
