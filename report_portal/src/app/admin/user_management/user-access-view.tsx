"use client";

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findAllusers } from "@/services/user-service";
import { findAllWorkspaces } from "@/services/workspace-services";
import { findAllReports, findAllDisplayViews } from "@/services/report-service";
import { UserCheck, Folder, FileText, Eye } from "lucide-react";

export default function UserAccessView() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [displayViews, setDisplayViews] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [uRes, wsRes, rptRes, dvRes] = await Promise.all([
        findAllusers(),
        findAllWorkspaces(),
        findAllReports(),
        findAllDisplayViews(),
      ]);

      if (uRes.status === 200) {
        const list = uRes.data || [];
        setUsers(list);
        if (list.length > 0) {
          setSelectedUserId(String(list[0].id));
          setSelectedUser(list[0]);
        }
      }
      if (wsRes.status === 200) setWorkspaces(wsRes.data || []);
      if (rptRes.status === 200) setReports(rptRes.data || []);
      if (dvRes.status === 200) setDisplayViews(dvRes.data || []);
    } catch (err) {
      console.error("Error fetching data for User Access View:", err);
    }
  };

  const handleSelectUser = (idStr: string) => {
    setSelectedUserId(idStr);
    const found = users.find(u => String(u.id) === idStr);
    setSelectedUser(found || null);
  };

  // Build matrix of Workspace | Report | View for the selected user
  const getUserAccessRows = () => {
    if (!selectedUser) return [];

    const userRoles: string[] = String(selectedUser.role || "").split(',').map((r: string) => r.trim().toLowerCase());
    const isAdmin = selectedUser.is_admin === true || userRoles.some(r => r === "admin" || r === "administrator");
    const isSuperUser = userRoles.some(r => r === "super user" || r === "superuser");

    const assignedWsIds = (selectedUser.workspaces || []).map((w: any) => w.id);
    const assignedRptIds = (selectedUser.reports || []).map((r: any) => r.id);
    const assignedDvIds = (selectedUser.displayviews || []).map((dv: any) => dv.id);

    let rows: any[] = [];

    workspaces.forEach((ws: any) => {
      const wsNameLower = String(ws.name || "").toLowerCase();
      const isWsMemberByRole = isSuperUser || userRoles.some((r: string) => r.includes(wsNameLower) || r === `${wsNameLower} wsmember`);
      const hasWsDirectAccess = isAdmin || isSuperUser || isWsMemberByRole || assignedWsIds.includes(ws.id);

      const wsReports = reports.filter((r: any) => r.workspace?.id === ws.id);

      wsReports.forEach((rpt: any) => {
        const hasReportDirectAccess = hasWsDirectAccess || assignedRptIds.includes(rpt.id);

        const rptDisplayViews = displayViews.filter((dv: any) => dv.report?.id === rpt.id);

        const defaultDv = rptDisplayViews.find((dv: any) => 
          String(dv.displayview_name || "").toLowerCase() === String(rpt.report_name || "").toLowerCase()
        );
        const hasDefaultDvAccess = defaultDv && assignedDvIds.includes(defaultDv.id);

        // Rule 1: If access to default view or report -> user gets all views
        const hasFullViewsAccess = hasReportDirectAccess || hasDefaultDvAccess;

        if (hasFullViewsAccess) {
          // Add row for report and all its views
          if (rptDisplayViews.length === 0) {
            rows.push({
              workspace: ws.name,
              report: rpt.report_name,
              view: "Default View (Report Name)",
              accessType: isAdmin ? "Admin (All Access)" : isSuperUser ? "Super User" : isWsMemberByRole ? `${ws.name} WSMember` : "Full Access (Default View)",
            });
          } else {
            rptDisplayViews.forEach((dv: any) => {
              const isDefault = String(dv.displayview_name || "").toLowerCase() === String(rpt.report_name || "").toLowerCase();
              rows.push({
                workspace: ws.name,
                report: rpt.report_name,
                view: dv.displayview_name + (isDefault ? " (Default View)" : ""),
                accessType: isAdmin ? "Admin (All Access)" : isSuperUser ? "Super User" : isWsMemberByRole ? `${ws.name} WSMember` : "Inherited View Access",
              });
            });
          }
        } else {
          // Rule 2: Specific view access only
          rptDisplayViews.forEach((dv: any) => {
            if (assignedDvIds.includes(dv.id)) {
              rows.push({
                workspace: ws.name,
                report: rpt.report_name,
                view: dv.displayview_name,
                accessType: "Specific View Granted",
              });
            }
          });
        }
      });
    });

    return rows;
  };

  const rowsToRender = getUserAccessRows();

  return (
    <div className="bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs space-y-4">
      {/* Top Header & User Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#edf4fa]">
        <div>
          <h2 className="text-sm font-bold text-[#0a1c30] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#2f8fe0]" />
            User Access View
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#0a1c30] whitespace-nowrap">Select User</span>
          <Select value={selectedUserId} onValueChange={handleSelectUser}>
            <SelectTrigger className="w-64 h-9 text-xs border-[#c8dced] bg-[#f8fbfe] font-medium text-[#0f2b48]">
              <SelectValue placeholder="Select User..." />
            </SelectTrigger>
            <SelectContent className="text-xs border-[#c8dced]">
              {users.map(u => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected User Detail Card */}
      {selectedUser && (
        <div className="bg-[#f8fbfe] border border-[#e2edfa] rounded-lg p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1890ff] text-white flex items-center justify-center font-bold text-xs">
              {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="font-bold text-[#0a1c30]">{selectedUser.name}</div>
              <div className="text-[#5c7f9f] text-[11px]">{selectedUser.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#5c7f9f]">ROLES</span>
            <span className="bg-[#eaf4fd] text-[#1890ff] font-bold text-[10px] px-2.5 py-1 rounded-full border border-[#c8dced]">
              {selectedUser.role || (selectedUser.is_admin ? "Admin" : "User")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#5c7f9f]">STATUS</span>
            <span className={`font-bold text-[10px] px-2.5 py-1 rounded-full ${selectedUser.is_active !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {selectedUser.is_active !== false ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
        </div>
      )}

      {/* Access Matrix Table matching Image 2 bottom */}
      <div className="overflow-x-auto rounded-lg border border-[#dce6f1]">
        <Table className="text-xs">
          <TableHeader className="bg-[#edf4fa]">
            <TableRow className="border-[#dce6f1]">
              <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase">Workspace</TableHead>
              <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase">Report</TableHead>
              <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase">View</TableHead>
              <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase text-right">Access Grant Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowsToRender.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-[#5c7f9f]">
                  No assigned workspace or report view permissions found for this user.
                </TableCell>
              </TableRow>
            ) : (
              rowsToRender.map((row, idx) => (
                <TableRow key={idx} className="border-[#dce6f1] hover:bg-[#f6fafc]">
                  <TableCell className="font-semibold text-[#0a1c30] flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-[#1890ff]" />
                    {row.workspace}
                  </TableCell>
                  <TableCell className="text-[#0f2b48] font-medium">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#2f8fe0]" />
                      {row.report}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#335375]">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#8aa6bf]" />
                      {row.view}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="bg-[#eaf4fd] text-[#1e5f99] px-2 py-0.5 rounded text-[10px] font-bold">
                      {row.accessType}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
