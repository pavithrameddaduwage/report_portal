import { AppSidebar } from "@/components/AppSideBar";
import { ReactNode, Suspense } from "react";

export default function WorkspacesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#f6f9fc] overflow-hidden">
      {/* Left Sidebar */}
      <Suspense fallback={<div className="w-64 bg-[#0b2138] h-full" />}>
        <AppSidebar />
      </Suspense>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto px-6 py-4 flex flex-col">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#5c7f9f]">Loading...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}