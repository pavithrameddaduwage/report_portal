import { AppSidebar } from "@/components/AppSideBar";
import { ReactNode } from "react";

export default function WorkspacesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#f6f9fc] overflow-hidden">
      {/* Left Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto px-6 py-4 flex flex-col">
        {children}
      </main>
    </div>
  );
}