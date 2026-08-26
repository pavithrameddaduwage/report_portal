"use client";

import { Shield, Grid, FileText, Monitor, Home, Users, Key, ChevronRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { findAllWorkspaces } from "@/services/workspace-services";
import { findUserByEmail } from "@/services/user-service";
import { getUserPermissions, UserPermissions } from "@/lib/permissions";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentReportId = searchParams?.get("reportId");
  const router = useRouter();
  
  const [permissions, setPermissions] = useState<UserPermissions>({
    user: null,
    isAdmin: true,
    canAccessAdminPanel: true,
    canManageUsers: true,
    canManageWorkspaces: true,
    canConfigureReports: true,
    canConfigureDisplayViews: true,
  });
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<number, boolean>>({});
  
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    const perms = getUserPermissions();
    setPermissions(perms);
    if (perms.user?.email) {
      loadWorkspaces(perms.user.email);
    } else {
      loadWorkspaces("");
    }
  }, [pathname]);

  const loadWorkspaces = async (email: string) => {
    try {
      const wsRes = await findAllWorkspaces();
      if (wsRes.status === 200) {
        let wsData = wsRes.data || [];
        wsData = wsData.map((ws: any) => ({
          ...ws,
          reports: (ws.reports || []).map((rpt: any) => ({ ...rpt, authorized: true })),
        }));

        setWorkspaces(wsData);
        const initialExpanded: Record<number, boolean> = {};
        wsData.forEach((w: any) => {
          initialExpanded[w.id] = true;
        });
        setExpandedWorkspaces(initialExpanded);
      }
    } catch (e) {
      console.error("Error loading workspaces in sidebar:", e);
    }
  };

  const toggleWorkspace = (id: number) => {
    setExpandedWorkspaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const signingOut = async () => {
    try {
      localStorage.removeItem("access_token");
      router.push("/login");
    } catch (error) {
      router.push("/login");
    }
  };

  return (
    <aside className="w-[240px] bg-[#0b2138] text-white flex flex-col h-screen shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#2f8fe0] text-white flex items-center justify-center font-bold text-base shadow-sm">
          H
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-[11px] tracking-wider uppercase leading-tight">HORIZON GROUP USA</span>
          <span className="text-[#5aa8ea] text-[11px] font-medium leading-tight">Report Portal</span>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="px-3 flex-1 flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-1 mb-6">
          <Link
            href="/workspaces"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              !isAdminRoute
                ? "bg-[#173759] text-white font-semibold"
                : "text-[#8fa3b7] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Workspaces</span>
          </Link>

          <Link
            href="/admin/report_configuration"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
              isAdminRoute
                ? "bg-[#173759] text-white font-semibold"
                : "text-[#8fa3b7] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Shield className="w-4 h-4 text-[#2f8fe0]" />
            <span>Admin Panel</span>
          </Link>
        </div>

        {/* Admin Sections OR Workspace Tree */}
        {isAdminRoute ? (
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#64748b] tracking-wider uppercase px-3 mb-2">
              ADMIN SECTIONS
            </span>
            <div className="flex flex-col gap-1">
              {[
                { title: "Report", url: "/admin/report_configuration", icon: FileText },
                { title: "Display View", url: "/admin/display_view", icon: Monitor },
                { title: "Workspace", url: "/admin/workspace_master", icon: Home },
                { title: "Users", url: "/admin/user_management", icon: Users },
                { title: "Roles & Permissions", url: "/admin/roles", icon: Key },
              ].map((item) => {
                const isActive = pathname?.startsWith(item.url);
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                      isActive
                        ? "bg-[#173759] text-white font-semibold"
                        : "text-[#8fa3b7] hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#64748b] tracking-wider uppercase px-3 mb-2">
              YOUR WORKSPACES
            </span>
            <div className="flex flex-col gap-1">
              {workspaces.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[#8fa3b7]">No workspaces</div>
              ) : (
                workspaces.map((ws: any) => {
                  const isExpanded = expandedWorkspaces[ws.id] !== false;
                  const authReports = (ws.reports || []).filter((r: any) => r.authorized !== false);

                  return (
                    <div key={ws.id} className="flex flex-col">
                      <button
                        onClick={() => toggleWorkspace(ws.id)}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[13px] text-white hover:bg-white/[0.04] text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Home className="w-3.5 h-3.5 text-[#8fa3b7] shrink-0" />
                          <span className="truncate font-medium">{ws.name}</span>
                        </div>
                        {authReports.length > 0 && (
                          <span className="text-[#64748b]">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                        )}
                      </button>

                      {isExpanded && authReports.length > 0 && (
                        <div className="ml-5 pl-3 border-l border-[#1b344d] my-1 flex flex-col gap-1">
                          {authReports.map((rpt: any) => {
                            const isRptActive = pathname === `/workspaces/${ws.id}` && currentReportId === String(rpt.id);
                            return (
                              <Link
                                key={rpt.id}
                                href={`/workspaces/${ws.id}?reportId=${rpt.id}`}
                                className={`flex items-center gap-2 py-1 px-2 rounded text-[12px] transition-colors truncate ${
                                  isRptActive
                                    ? "text-white bg-[#173759] font-medium"
                                    : "text-[#8fa3b7] hover:text-white"
                                }`}
                              >
                                <FileText className="w-3 h-3 shrink-0" />
                                <span className="truncate">{rpt.report_name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer with User Profile and Role Indicator */}
      <div className="p-4 border-t border-[#142d47] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[#2f8fe0] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {permissions.user?.name ? permissions.user.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : 'AU'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-[12px] font-semibold truncate leading-tight">
              {permissions.user?.name || 'Admin User'}
            </span>
            <span className="text-[#5aa8ea] text-[10px] font-medium leading-tight">
              {permissions.user?.roles?.[0] || (permissions.isAdmin ? "Administrator" : "User")}
            </span>
          </div>
        </div>
        <button
          onClick={signingOut}
          className="bg-[#112942] hover:bg-[#18395c] text-white text-[11px] font-medium px-3 py-1 rounded-md transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}