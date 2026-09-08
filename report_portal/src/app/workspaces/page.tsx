"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { findAllWorkspaces } from "@/services/workspace-services";
import { findUserByEmail } from "@/services/user-service";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { Search, Home, FileText, ArrowRight, Folder, Loader2, Eye, X } from "lucide-react";

export default function WorkspacesPage() {
  const router = useRouter(); 
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [displayworkspaces, setDisplayWorkspaces] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedReports, setExpandedReports] = useState<Record<number, boolean>>({});

  const toggleReportExpand = (repId: number) => {
    setExpandedReports(prev => ({ ...prev, [repId]: !prev[repId] }));
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const user: any = jwtDecode(token);
      getAllWorkspaces(user);
    } else {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      const token = localStorage.getItem("access_token");
      if (token) getAllWorkspaces(jwtDecode(token), true);
    };
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const getAllWorkspaces = async (decodedUser: any, isSilent: boolean = false) => {
    try {
      if (!isSilent) setLoading(true);
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
        email ? findUserByEmail({ email, userid: decodedUser?.userid }) : Promise.resolve(null),
        findAllWorkspaces(),
      ]);

      let userDb: any = null;
      if (userRes.status === "fulfilled" && userRes.value?.status === 200) {
        const userPayload = userRes.value.data;
        userDb = userPayload?.data || userPayload;
      }

      let rawWorkspaces: any[] = [];
      if (wsRes.status === "fulfilled" && wsRes.value?.status === 200) {
        const workspacePayload = wsRes.value.data;
        const workspaceData = workspacePayload?.data || workspacePayload;
        rawWorkspaces = Array.isArray(workspaceData)
          ? workspaceData
          : workspaceData && typeof workspaceData === "object"
          ? [workspaceData]
          : [];
      }

      if (rawWorkspaces.length === 0 && userDb?.workspaces?.length) {
        rawWorkspaces = userDb.workspaces.map((workspace: any) => ({
          ...workspace,
          reports: [],
        }));
      }

      const userRoles: string[] = (userDb?.role ? userDb.role.split(',') : [rawRole]).map((r: string) => r.trim().toLowerCase());
      const isSuperUser = userRoles.some((r: string) => r === "super user" || r === "superuser");
      const isAdmin =
        isAdminToken ||
        userDb?.is_admin === true ||
        userRoles.some((r: string) => r === "admin" || r === "administrator");

      const workspaceids = userDb && userDb.workspaces ? userDb.workspaces.map((ws: any) => Number(ws.id)) : [];
      const reportids = userDb && userDb.reports ? userDb.reports.map((rpt: any) => Number(rpt.id)) : [];
      const displayviewReportids = userDb && userDb.displayviews ? userDb.displayviews.map((dv: any) => Number(dv.report?.id || dv.reportId)).filter((id: number) => !isNaN(id) && id > 0) : [];
      const userAssignedDvIds = userDb && userDb.displayviews ? userDb.displayviews.map((dv: any) => Number(dv.id)) : [];

      if (isAdmin && !isSuperUser && !isSilent) {
        router.push("/admin/user_management");
        return;
      }

      const finalworkspaces = rawWorkspaces
        .map((ws: any) => {
          const wsIdNum = Number(ws.id);
          const wsNameLower = String(ws.name || "").toLowerCase();
          const isWsMemberByRole = userRoles.some((r: string) => r.includes(wsNameLower) || r === `${wsNameLower} wsmember`);
          
          const isWsAuth = isSuperUser || isWsMemberByRole || workspaceids.includes(wsIdNum);
          const authorizedReports = (ws.reports || [])
            .map((rpt: any) => {
              const rptIdNum = Number(rpt.id);
              const rptViews = rpt.display_view_names || rpt.displayviews || [];
              const isRptAuth = isSuperUser || isWsAuth || reportids.includes(rptIdNum) || displayviewReportids.includes(rptIdNum);

              const authorizedViews = rptViews.filter((dv: any) => {
                const dvIdNum = Number(dv.id);
                return isSuperUser || isRptAuth || userAssignedDvIds.includes(dvIdNum);
              });

              return {
                ...rpt,
                authorized: isRptAuth || authorizedViews.length > 0,
                views: authorizedViews,
              };
            })
            .filter((rpt: any) => rpt.authorized);

          return {
            ...ws,
            authorized: isWsAuth || authorizedReports.length > 0,
            reports: authorizedReports,
          };
        })
        .filter((ws: any) => ws.authorized);

      setWorkspaces(finalworkspaces);
      if (searchQuery.trim()) {
        filterAndSetWorkspaces(finalworkspaces, searchQuery);
      } else {
        setDisplayWorkspaces(finalworkspaces);
      }
    } catch (e) {
      console.error("Error loading workspaces:", e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const filterAndSetWorkspaces = (allWs: any[], query: string) => {
    let filtered: any[] = [];
    allWs.forEach((ws: any) => {
      let filterWS: any = { ...ws };
      let matchingReports: any = [];
      (ws.reports || []).forEach((rpt: any) => {
        if (rpt.report_name?.toString().toLowerCase().includes(query.toLowerCase())) {
          matchingReports.push(rpt);
        }
      });
      if (matchingReports.length > 0 || ws.name?.toLowerCase().includes(query.toLowerCase())) {
        filterWS.reports = matchingReports.length > 0 ? matchingReports : ws.reports;
        filtered.push(filterWS);
      }
    });
    setDisplayWorkspaces(filtered);
  };

  const handleReportSearch = (e: any) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setDisplayWorkspaces(workspaces);
      return;
    }
    filterAndSetWorkspaces(workspaces, val);
  };

  return (
    <div className="w-full flex flex-col">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <span className="text-[11px] font-bold text-[#2f8fe0] tracking-wider block mb-0.5">
            Report Portal
          </span>
          <h1 className="text-[22px] font-bold text-[#0a1c30] leading-tight">
            Horizon Report Portal
          </h1>
        </div>
        
        {/* Search Input and Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search reports or workspaces..."
              value={searchQuery}
              onChange={handleReportSearch}
              className="border border-[#dce6f1] rounded-md text-xs h-8 pl-8 pr-8 w-64 bg-white text-[#0f2b48] placeholder:text-[#8aa6bf] focus:outline-none focus:border-[#2f8fe0] shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDisplayWorkspaces(workspaces);
                }}
                className="absolute right-2.5 top-2.5 text-[#8aa6bf] hover:text-[#0a1c30] transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
          {displayworkspaces.map((workspace: any) => {
            const authReports = (workspace.reports || []).filter((r: any) => r.authorized !== false);

            return (
              <div 
                key={workspace.id} 
                className="bg-white rounded-xl border border-[#dce6f1] shadow-2xs hover:shadow-md hover:border-[#2f8fe0] transition-all p-4.5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header with Heading & Badge on same level */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#f0f6fc]">
                    <h3 className="font-bold text-base sm:text-lg text-[#0a1c30] truncate" title={workspace.name}>
                      {workspace.name}
                    </h3>
                    <span className="bg-[#f0f6fc] text-[#1e5f99] text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                      {authReports.length} {authReports.length === 1 ? "report" : "reports"}
                    </span>
                  </div>

                  {/* Reports List inside Card (2 per row, clean layout without outlines/shadings) */}
                  <div className="my-1 min-h-[250px] max-h-[380px] overflow-y-auto pr-1">
                    {authReports.length === 0 ? (
                      <div className="h-full flex items-center justify-center py-8">
                        <span className="text-[11px] text-[#8aa6bf] italic">
                          No reports assigned yet
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {authReports.map((rep: any) => (
                          <Link
                            key={rep.id}
                            href={`/workspaces/${workspace.id}?reportId=${rep.id}`}
                            className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-[#edf4fa] transition-colors group min-w-0"
                          >
                            <FileText className="w-4 h-4 text-[#2f8fe0] shrink-0" />
                            <span className="text-[13px] font-semibold text-[#0a1c30] group-hover:text-[#2f8fe0] transition-colors truncate" title={rep.report_name}>
                              {rep.report_name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
