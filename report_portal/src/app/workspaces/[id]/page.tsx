"use client";

import AdvancedTable from "@/components/AdvanceTable";
import { findUserByEmail } from "@/services/user-service";
import { findWorkspaceById } from "@/services/workspace-services";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { findDisplayViewByReportId } from "@/services/report-service";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter(); 
  const searchParams = useSearchParams();
  const { id } = use(params);
  const reportId = searchParams.get("reportId");
  const [workspace, setWorkspace] = useState<any>([]);
  const [selectedReport, setSelectedReport] = useState<any>();
  const [displayViews, setDisplayViews] = useState<any>();
  const [user, setUser] = useState<any>();
  const [allowedDisplayview, setAllowedDisplayView] = useState<any>();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const user: any = jwtDecode(token);
      fetchworkspace(user.email);
    } else {
      router.push("/login");
    }
  }, [reportId]);

  const fetchworkspace = async (email: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const decoded: any = token ? jwtDecode(token) : null;
      const rawRole = String(decoded?.role || "").toLowerCase();
      const isAdminToken =
        decoded?.is_admin === true ||
        decoded?.isAdmin === true ||
        rawRole === "admin" ||
        rawRole === "administrator";

      const [userRes, wsRes] = await Promise.allSettled([
        email ? findUserByEmail({ email }) : Promise.resolve(null),
        findWorkspaceById(parseInt(id)),
      ]);

      let userDb: any = null;
      if (userRes.status === "fulfilled" && userRes.value?.status === 200) {
        userDb = userRes.value.data;
        setUser(userDb);
      }

      const userRoles: string[] = (userDb?.role ? userDb.role.split(',') : [rawRole]).map((r: string) => r.trim().toLowerCase());
      const isAdmin =
        isAdminToken ||
        userDb?.is_admin === true ||
        userRoles.some((r: string) => r === "admin" || r === "administrator");

      const isSuperUser = userRoles.some((r: string) => r === "super user" || r === "superuser");

      if (wsRes.status === "fulfilled" && wsRes.value?.status === 200) {
        const data = wsRes.value.data;
        const wsNameLower = String(data.name || "").toLowerCase();
        const isWsMemberByRole = isSuperUser || userRoles.some((r: string) => r.includes(wsNameLower) || r === `${wsNameLower} wsmember`);
        const workspaceids = userDb && userDb.workspaces ? userDb.workspaces.map((ws: any) => ws.id) : [];
        const reportids = userDb && userDb.reports ? userDb.reports.map((rpt: any) => rpt.id) : [];
        const displayviewReportids = userDb && userDb.displayviews ? userDb.displayviews.map((dv: any) => dv.report?.id || dv.reportId).filter(Boolean) : [];

        data.reports = (data.reports || [])
          .map((rpt: any) => {
            rpt["authorized"] = isAdmin || isWsMemberByRole || workspaceids.includes(data.id) || reportids.includes(rpt.id) || displayviewReportids.includes(rpt.id);
            return rpt;
          })
          .filter((rpt: any) => rpt.authorized);

        let report = null;
        if (reportId) {
          report = data.reports.find((f: any) => f.id == reportId);
        } else if (data.reports.length > 0) {
          report = data.reports[0];
        }

        if (report) {
          handleReportSelect(report, userDb, data, isAdmin);
          setSelectedReport(report);
        }
        setWorkspace(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReportSelect = async (report: any, selecteduser?: any, currentWs?: any, isAdminOverride?: boolean) => {
    const response = await findDisplayViewByReportId(report.id);
    if (response.status === 200) {
      const allDvs = response.data || [];
      setDisplayViews(allDvs);
      const dvids = allDvs.map((f: any) => f.id);

      const token = localStorage.getItem("access_token");
      const decoded: any = token ? jwtDecode(token) : null;
      let tempuser = user || selecteduser;
      
      const rawRole = String(decoded?.role || "").toLowerCase();
      const userRoles: string[] = (tempuser?.role ? tempuser.role.split(',') : [rawRole]).map((r: string) => r.trim().toLowerCase());
      
      const isAdmin =
        isAdminOverride ??
        (decoded?.is_admin === true ||
          tempuser?.is_admin === true ||
          userRoles.some((r: string) => r === "admin" || r === "administrator"));

      const isSuperUser = userRoles.some((r: string) => r === "super user" || r === "superuser");
      
      const targetWs = currentWs || workspace;
      const wsNameLower = String(targetWs?.name || "").toLowerCase();
      const isWsMemberByRole = isSuperUser || userRoles.some((r: string) => r.includes(wsNameLower) || r === `${wsNameLower} wsmember`);
      const isDirectWsAuth = (tempuser?.workspaces || []).some((w: any) => w.id === targetWs?.id);
      
      const userAssignedReportIds = (tempuser?.reports || []).map((r: any) => r.id);
      const userAssignedDvIds = (tempuser?.displayviews || []).map((dv: any) => dv.id);

      // Rule 1: If user has access to Default View (named as report_name or report assignment), user gets ALL views of report!
      const hasDefaultViewAccess = (tempuser?.displayviews || []).some((dv: any) => {
        const dvReportId = dv.report?.id || dv.reportId;
        const dvNameLower = String(dv.displayview_name || "").toLowerCase();
        const rptNameLower = String(report.report_name || "").toLowerCase();
        return dvReportId === report.id && (dvNameLower === rptNameLower || dvNameLower === "default view");
      });

      const hasFullReportAccess = isAdmin || isWsMemberByRole || isDirectWsAuth || userAssignedReportIds.includes(report.id) || hasDefaultViewAccess;

      let alloweddv: any = [];
      if (hasFullReportAccess) {
        // Rule 1: Grant all views
        alloweddv = allDvs.map((f: any) => ({ value: f.id, label: f.displayview_name }));
      } else {
        // Rule 2: Grant only specific assigned views
        allDvs.forEach((f: any) => {
          if (userAssignedDvIds.includes(f.id)) {
            alloweddv.push({ value: f.id, label: f.displayview_name });
          }
        });
      }

      setAllowedDisplayView({ dv_count: dvids.length, displayViews: alloweddv });
    }
    setSelectedReport(report);
  };

  return (
    <div className="w-full flex flex-col">
      {/* Top Header */}
      <div className="mb-3">
        <span className="text-[11px] font-bold text-[#2f8fe0] uppercase tracking-wider block mb-0.5">
          REPORT VIEW
        </span>
        <h1 className="text-[20px] font-bold text-[#0a1c30] leading-tight">
          {selectedReport?.report_name || "Data Report"}
        </h1>
        <p className="text-xs text-[#2b5278] font-normal mt-0.5">
          {workspace?.name || "Workspace"}
        </p>
      </div>

      {/* Main Report Table */}
      <div className="w-full">
        {selectedReport ? (
          <AdvancedTable
            schema={selectedReport.database_schema}
            view={selectedReport.report_view}
            displaycolumns={selectedReport.columns}
            reportname={selectedReport.report_name}
            reportid={selectedReport.id}
            allowed_displayviews={allowedDisplayview}
          />
        ) : (
          <div className="bg-white rounded-xl border border-[#c8dced] p-8 text-center text-[#4a759f] text-xs shadow-2xs">
            Loading report data...
          </div>
        )}
      </div>
    </div>
  );
}
