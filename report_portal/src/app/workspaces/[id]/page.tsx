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

      const isAdmin =
        isAdminToken ||
        userDb?.is_admin === true ||
        String(userDb?.role || "").toLowerCase() === "admin";

      if (wsRes.status === "fulfilled" && wsRes.value?.status === 200) {
        const data = wsRes.value.data;
        const workspaceids = userDb && userDb.workspaces ? userDb.workspaces.map((ws: any) => ws.id) : [];
        const reportids = userDb && userDb.reports ? userDb.reports.map((rpt: any) => rpt.id) : [];

        data.reports = (data.reports || []).map((rpt: any) => {
          rpt["authorized"] = isAdmin || workspaceids.includes(data.id) || reportids.includes(rpt.id);
          return rpt;
        });

        let report = null;
        if (reportId) {
          report = data.reports.find((f: any) => f.id == reportId);
        } else if (data.reports.length > 0) {
          report = data.reports.find((f: any) => f.authorized) || data.reports[0];
        }

        if (report) {
          handleReportSelect(report, userDb, isAdmin);
          setSelectedReport(report);
        }
        setWorkspace(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReportSelect = async (report: any, selecteduser?: any, isAdminOverride?: boolean) => {
    const response = await findDisplayViewByReportId(report.id);
    if (response.status === 200) {
      const allDvs = response.data || [];
      setDisplayViews(allDvs);
      const dvids = allDvs.map((f: any) => f.id);

      const token = localStorage.getItem("access_token");
      const decoded: any = token ? jwtDecode(token) : null;
      const isAdmin =
        isAdminOverride ??
        (decoded?.is_admin === true ||
          String(decoded?.role || "").toLowerCase() === "admin");

      let alloweddv: any = [];
      if (isAdmin) {
        alloweddv = allDvs.map((f: any) => ({ value: f.id, label: f.displayview_name }));
      } else {
        let tempuser = user || selecteduser;
        if (tempuser && tempuser.displayviews) {
          tempuser.displayviews.forEach((f: any) => {
            if (dvids.includes(f.id)) {
              alloweddv.push({ value: f.id, label: f.displayview_name });
            }
          });
        }
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
