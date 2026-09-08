"use client";

import { AppSidebar } from "@/components/AppSideBar";
import { ReactNode, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUserPermissions } from "@/lib/permissions";

const getPageTitle = (pathname: string) => {
  if (pathname.includes("report_configuration")) return "Report configuration";
  if (pathname.includes("display_view")) return "Display view configuration";
  if (pathname.includes("workspace_master")) return "Workspace management";
  if (pathname.includes("user_management")) return "User & Access Management";
  if (pathname.includes("report_scheduler")) return "Report Scheduler & Email Dispatcher";
  if (pathname.includes("roles")) return "Roles & permissions";
  return "Admin Panel";
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname || "");
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const perms = getUserPermissions();
    if (!perms.canAccessAdminPanel) {
      router.push("/workspaces");
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-[#f6f9fc] overflow-hidden">
      {/* Left Sidebar */}
      <Suspense fallback={<div className="w-64 bg-[#0b2138] h-full" />}>
        <AppSidebar />
      </Suspense>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto px-6 py-4 flex flex-col">
        {/* Header Title */}
        <div className="mb-4">
          <span className="text-[11px] font-bold text-[#2f8fe0] tracking-wider block mb-0.5">
            Admin Panel
          </span>
          <h1 className="text-[20px] font-bold text-[#0a1c30] leading-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Suspense fallback={<div className="p-8 text-center text-xs text-[#5c7f9f]">Loading...</div>}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}