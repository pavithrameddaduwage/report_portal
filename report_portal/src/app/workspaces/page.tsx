"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { findAllWorkspaces } from "@/services/workspace-services";
import { findUserByEmail } from "@/services/user-service";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { Search, Home, FileText, ArrowRight, Folder, Loader2 } from "lucide-react";

export default function WorkspacesPage() {
  const router = useRouter(); 
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [displayworkspaces, setDisplayWorkspaces] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const user: any = jwtDecode(token);
      getAllWorkspaces(user);
    } else {
      router.push("/login");
    }
  }, []);

  const getAllWorkspaces = async (decodedUser: any) => {
    try {
      setLoading(true);
      const email = decodedUser?.email || "";
      const rawRole = String(decodedUser?.role || "").toLowerCase();
      const isAdminToken =
        decodedUser?.is_admin === true ||
        decodedUser?.isAdmin === true ||
        rawRole === "admin" ||
        rawRole === "administrator" ||
        (Array.isArray(decodedUser?.roles) &&
          decodedUser.roles.some((r: any) => String(r).toLowerCase() === "admin"));

      // Fetch user details and workspaces in parallel for fast loading
      const [userRes, wsRes] = await Promise.allSettled([
        email ? findUserByEmail({ email }) : Promise.resolve(null),
        findAllWorkspaces(),
      ]);

      let userDb: any = null;
      if (userRes.status === "fulfilled" && userRes.value?.status === 200) {
        userDb = userRes.value.data;
      }

      const isAdmin =
        isAdminToken ||
        userDb?.is_admin === true ||
        String(userDb?.role || "").toLowerCase() === "admin";

      let rawWorkspaces: any[] = [];
      if (wsRes.status === "fulfilled" && wsRes.value?.status === 200) {
        rawWorkspaces = wsRes.value.data || [];
      }

      const workspaceids = userDb && userDb.workspaces ? userDb.workspaces.map((ws: any) => ws.id) : [];
      const reportids = userDb && userDb.reports ? userDb.reports.map((rpt: any) => rpt.id) : [];

      const finalworkspaces = rawWorkspaces.map((ws: any) => {
        const isWsAuth = isAdmin || workspaceids.includes(ws.id);
        const reports = (ws.reports || []).map((rpt: any) => ({
          ...rpt,
          authorized: isAdmin || isWsAuth || reportids.includes(rpt.id),
        }));
        return {
          ...ws,
          authorized: isWsAuth || reports.some((r: any) => r.authorized),
          reports,
        };
      });

      setWorkspaces(finalworkspaces);
      setDisplayWorkspaces(finalworkspaces);
    } catch (e) {
      console.error("Error loading workspaces:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSearch = (e: any) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setDisplayWorkspaces(workspaces);
      return;
    }

    let filtered: any[] = [];
    workspaces.forEach((ws: any) => {
      let filterWS: any = { ...ws };
      let matchingReports: any = [];
      (ws.reports || []).forEach((rpt: any) => {
        if (rpt.report_name?.toString().toLowerCase().includes(val.toLowerCase())) {
          matchingReports.push(rpt);
        }
      });
      if (matchingReports.length > 0 || ws.name?.toLowerCase().includes(val.toLowerCase())) {
        filterWS.reports = matchingReports.length > 0 ? matchingReports : ws.reports;
        filtered.push(filterWS);
      }
    });
    setDisplayWorkspaces(filtered);
  };

  return (
    <div className="w-full flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <span className="text-[11px] font-bold text-[#2f8fe0] uppercase tracking-wider block mb-0.5">
            REPORT PORTAL
          </span>
          <h1 className="text-[22px] font-bold text-[#0a1c30] leading-tight">
            Horizon Report Portal
          </h1>
          <p className="text-xs text-[#335375] font-normal mt-0.5">
            Select a workspace to browse and view reports
          </p>
        </div>
        
        {/* Search Input and Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search reports or workspaces..."
              value={searchQuery}
              onChange={handleReportSearch}
              className="border border-[#dce6f1] rounded-md text-xs h-8 pl-8 pr-3 w-64 bg-white text-[#0f2b48] placeholder:text-[#8aa6bf] focus:outline-none focus:border-[#2f8fe0] shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-[#dce6f1]">
          <Loader2 className="w-6 h-6 animate-spin text-[#2f8fe0] mb-2" />
          <span className="text-xs text-[#5c7f9f]">Loading workspaces...</span>
        </div>
      ) : displayworkspaces.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#dce6f1] p-12 text-center text-xs text-[#5c7f9f] shadow-2xs">
          No workspaces or authorized reports found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
          {displayworkspaces.map((workspace: any) => {
            const authReports = (workspace.reports || []).filter((r: any) => r.authorized !== false);

            return (
              <div 
                key={workspace.id} 
                className="bg-white rounded-xl border border-[#dce6f1] shadow-2xs hover:shadow-md hover:border-[#2f8fe0] transition-all p-4 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#f0f6fc] text-[#2f8fe0] flex items-center justify-center shrink-0">
                      <Folder className="w-4 h-4" />
                    </div>
                    <span className="bg-[#f0f6fc] text-[#1e5f99] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {authReports.length} {authReports.length === 1 ? "report" : "reports"}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-sm text-[#0a1c30] truncate mb-1" title={workspace.name}>
                    {workspace.name}
                  </h3>
                  {workspace.description && (
                    <p className="text-[11px] text-[#5c7f9f] line-clamp-2 mb-3">
                      {workspace.description}
                    </p>
                  )}

                  {/* Reports List inside Card */}
                  <div className="flex flex-col gap-1.5 my-3 pt-2 border-t border-[#f0f6fc]">
                    {authReports.length === 0 ? (
                      <span className="text-[11px] text-[#8aa6bf] italic p-1">
                        No reports assigned yet
                      </span>
                    ) : (
                      authReports.slice(0, 3).map((rep: any) => (
                        <Link
                          key={rep.id}
                          href={`/workspaces/${workspace.id}?reportId=${rep.id}`}
                          className="flex items-center justify-between p-1.5 rounded-md hover:bg-[#f0f6fc] transition-colors group text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FileText className="w-3 h-3 text-[#2f8fe0] shrink-0" />
                            <span className="text-[#0f2b48] font-medium truncate group-hover:text-[#2f8fe0]">
                              {rep.report_name}
                            </span>
                          </div>
                        </Link>
                      ))
                    )}
                    {authReports.length > 3 && (
                      <span className="text-[10px] text-[#8aa6bf] font-medium pl-1">
                        + {authReports.length - 3} more reports
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Link */}
                <Link
                  href={
                    authReports.length > 0
                      ? `/workspaces/${workspace.id}?reportId=${authReports[0]?.id}`
                      : `/workspaces/${workspace.id}`
                  }
                  className="mt-2 w-full py-1.5 px-3 bg-[#f0f6fc] hover:bg-[#eaf4fd] text-[#1e5f99] hover:text-[#0a1c30] font-bold text-xs rounded-md text-center transition-colors block cursor-pointer"
                >
                  View Workspace
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
