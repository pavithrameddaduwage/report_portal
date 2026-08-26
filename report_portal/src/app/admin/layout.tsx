"use client";

import { AppSidebar } from "@/components/AppSideBar";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

const getPageTitle = (pathname: string) => {
  if (pathname.includes("report_configuration")) return "Report configuration";
  if (pathname.includes("display_view")) return "Display view configuration";
  if (pathname.includes("workspace_master")) return "Workspace management";
  if (pathname.includes("user_management")) return "User management";
  if (pathname.includes("roles")) return "Roles & permissions";
  return "Report configuration";
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname || "");

  return (
    <div className="flex h-screen bg-[#f6f9fc] overflow-hidden">
      {/* Left Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto px-6 py-4 flex flex-col">
        {/* Header Title */}
        <div className="mb-4">
          <span className="text-[11px] font-bold text-[#2f8fe0] uppercase tracking-wider block mb-0.5">
            ADMIN PANEL
          </span>
          <h1 className="text-[20px] font-bold text-[#0a1c30] leading-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}