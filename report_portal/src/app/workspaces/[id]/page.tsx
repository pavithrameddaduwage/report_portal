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
  }, []);

  const fetchworkspace = async (email: string) => {
    try {
      const userresponse = await findUserByEmail({ email });
      if (userresponse.status === 200 || userresponse.status === 201) {
        const user = userresponse.data;
        setUser(user);

        let workspaceids = user && user.workspaces ? user.workspaces.map((ws: any) => ws.id) : [];
        let reportids = user && user.reports ? user.reports.map((rpt: any) => rpt.id) : [];

        const res: any = await findWorkspaceById(parseInt(id));
        if (res.status === 200) {
          const data = res.data;

          if (workspaceids.includes(data.id)) {
            data.reports.map((rpt: any) => {
              rpt["authorized"] = true;
              return rpt;
            });
          } else {
            data.reports.map((rpt: any) => {
              rpt["authorized"] = reportids.includes(rpt.id);
              return rpt;
            });
          }

          let report = null;
          if (reportId) {
            report = data.reports.find((f: any) => f.id == reportId);
          } else if (data.reports.length > 0) {
            report = data.reports.find((f: any) => f.authorized);
          }

          if (report) {
            handleReportSelect(report, user);
            setSelectedReport(report);
          }
          setWorkspace(data);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReportSelect = async (report: any, selecteduser?: any) => {
    const response = await findDisplayViewByReportId(report.id);
    if (response.status === 200) {
      setDisplayViews(response.data);
      const dvids = response.data.map((f: any) => f.id);
      let alloweddv: any = [];

      let tempuser = user || selecteduser;
      if (tempuser && tempuser.displayviews) {
        tempuser.displayviews.forEach((f: any) => {
          if (dvids.includes(f.id)) {
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
