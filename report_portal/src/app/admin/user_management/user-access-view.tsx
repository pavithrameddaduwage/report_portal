"use client";

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserCheck, Folder, FileText, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useData } from "@/context/DataContext";
import { assignUsersToWorkspace } from "@/services/workspace-services";
import { assignUsersToReport, assignUsersToDisplayView } from "@/services/report-service";
import { toast } from "sonner";

export default function UserAccessView() {
  const { users, workspaces, reports, displayViews, fetchAllData } = useData();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [removingRow, setRemovingRow] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    fetchAllData(true);
  }, []);

  useEffect(() => {
    const refresh = () => fetchAllData(true);
    const interval = window.setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(String(users[0].id));
      setSelectedUser(users[0]);
    } else if (selectedUserId) {
      setSelectedUser(users.find(user => String(user.id) === selectedUserId) || null);
    }
  }, [selectedUserId, users]);

  const handleSelectUser = (idStr: string) => {
    setSelectedUserId(idStr);
    const found = users.find(u => String(u.id) === idStr);
    setSelectedUser(found || null);
  };

  // Comprehensive removal: revokes report, display view, and workspace assignments everywhere for this item
  const handleConfirmRemove = async () => {
    if (!removingRow || !selectedUser) return;
    setIsRemoving(true);
    try {
      const uId = Number(selectedUser.id);
      let ok = false;

      if (removingRow.targetType === "display_view" || removingRow.displayViewId) {
        const dvId = Number(removingRow.targetId || removingRow.displayViewId);
        const rptId = Number(removingRow.reportId);

        // 1. Remove user from this specific display view
        if (dvId) {
          const dvObj = displayViews.find((dv: any) => Number(dv.id) === dvId);
          const currentUsers = (dvObj?.users || []).map((u: any) => Number(u.id));
          const nextUsers = currentUsers.filter((id: number) => id !== uId);
          await assignUsersToDisplayView(dvId, nextUsers);
        }

        // 2. Also remove direct assignment from parent report if present
        if (rptId) {
          const rptObj = reports.find((r: any) => Number(r.id) === rptId);
          if (rptObj?.users?.some((u: any) => Number(u.id) === uId)) {
            const currentRptUsers = rptObj.users.map((u: any) => Number(u.id));
            const nextRptUsers = currentRptUsers.filter((id: number) => id !== uId);
            await assignUsersToReport(rptId, nextRptUsers);
          }
        }
        ok = true;
      } else if (removingRow.targetType === "report" || removingRow.reportId) {
        const rptId = Number(removingRow.targetId || removingRow.reportId);

        if (rptId) {
          // 1. Remove user from report.users
          const rptObj = reports.find((r: any) => Number(r.id) === rptId);
          if (rptObj) {
            const currentRptUsers = (rptObj.users || []).map((u: any) => Number(u.id));
            const nextRptUsers = currentRptUsers.filter((id: number) => id !== uId);
            await assignUsersToReport(rptId, nextRptUsers);
          }

          // 2. ALSO remove user from ALL display views under this report
          const rptDvs = displayViews.filter((dv: any) => Number(dv.report?.id) === rptId);
          for (const dv of rptDvs) {
            if (dv.users?.some((u: any) => Number(u.id) === uId)) {
              const currentDvUsers = (dv.users || []).map((u: any) => Number(u.id));
              const nextDvUsers = currentDvUsers.filter((id: number) => id !== uId);
              await assignUsersToDisplayView(dv.id, nextDvUsers);
            }
          }
        }
        ok = true;
      } else if (removingRow.targetType === "workspace" || removingRow.workspaceId) {
        const wsId = Number(removingRow.targetId || removingRow.workspaceId);

        if (wsId) {
          // 1. Remove user from workspace.users
          const wsObj = workspaces.find((w: any) => Number(w.id) === wsId);
          if (wsObj) {
            const currentWsUsers = (wsObj.users || []).map((u: any) => Number(u.id));
            const nextWsUsers = currentWsUsers.filter((id: number) => id !== uId);
            await assignUsersToWorkspace(wsId, nextWsUsers);
          }

          // 2. ALSO remove user from ALL reports & display views in this workspace
          const wsReports = reports.filter((r: any) => Number(r.workspace?.id) === wsId);
          for (const rpt of wsReports) {
            if (rpt.users?.some((u: any) => Number(u.id) === uId)) {
              const currentRptUsers = (rpt.users || []).map((u: any) => Number(u.id));
              const nextRptUsers = currentRptUsers.filter((id: number) => id !== uId);
              await assignUsersToReport(rpt.id, nextRptUsers);
            }
            const rptDvs = displayViews.filter((dv: any) => Number(dv.report?.id) === Number(rpt.id));
            for (const dv of rptDvs) {
              if (dv.users?.some((u: any) => Number(u.id) === uId)) {
                const currentDvUsers = (dv.users || []).map((u: any) => Number(u.id));
                const nextDvUsers = currentDvUsers.filter((id: number) => id !== uId);
                await assignUsersToDisplayView(dv.id, nextDvUsers);
              }
            }
          }
        }
        ok = true;
      }

      if (ok) {
        toast.success(`Access removed everywhere for ${selectedUser.name}`);
        await fetchAllData(true);
      } else {
        toast.error("Failed to remove access");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while removing access");
    } finally {
      setIsRemoving(false);
      setRemovingRow(null);
    }
  };

  // Build matrix of Workspace | Report | View for the selected user
  const getUserAccessRows = () => {
    if (!selectedUser) return [];

    const userRoles: string[] = String(selectedUser.role || "").split(',').map((r: string) => r.trim().toLowerCase());
    const isAdmin = selectedUser.is_admin === true || userRoles.some(r => r === "admin" || r === "administrator");
    const isSuperUser = userRoles.some(r => r === "super user" || r === "superuser");

    const assignedWsIds = (selectedUser.workspaces || []).map((w: any) => Number(w.id));
    const assignedRptIds = (selectedUser.reports || []).map((r: any) => Number(r.id));
    const assignedDvIds = (selectedUser.displayviews || []).map((dv: any) => Number(dv.id));

    let rows: any[] = [];

    workspaces.forEach((ws: any) => {
      const wsNameLower = String(ws.name || "").toLowerCase();
      const isWsMemberByRole = isSuperUser || userRoles.some((r: string) => r.includes(wsNameLower) || r === `${wsNameLower} wsmember`);
      const hasWsDirectAccess = isAdmin || isSuperUser || isWsMemberByRole || assignedWsIds.includes(Number(ws.id));

      const wsReports = reports.filter((r: any) => Number(r.workspace?.id) === Number(ws.id));

      wsReports.forEach((rpt: any) => {
        const hasReportDirectAccess = hasWsDirectAccess || assignedRptIds.includes(Number(rpt.id));

        const rptDisplayViews = displayViews.filter((dv: any) => Number(dv.report?.id) === Number(rpt.id));

        const defaultDv = rptDisplayViews.find((dv: any) => 
          String(dv.displayview_name || "").toLowerCase() === String(rpt.report_name || "").toLowerCase()
        );
        const hasDefaultDvAccess = defaultDv && assignedDvIds.includes(Number(defaultDv.id));

        // Rule 1: If access to default view or report -> user gets all views
        const hasFullViewsAccess = hasReportDirectAccess || hasDefaultDvAccess;

        if (hasFullViewsAccess) {
          if (rptDisplayViews.length === 0) {
            const isRptDirect = assignedRptIds.includes(Number(rpt.id));
            const isWsDirect = assignedWsIds.includes(Number(ws.id));
            rows.push({
              workspaceId: ws.id,
              reportId: rpt.id,
              displayViewId: null,
              workspace: ws.name,
              report: rpt.report_name,
              view: "Default View (Report Name)",
              accessType: isAdmin ? "Admin (All Access)" : isSuperUser ? "Super User" : isWsMemberByRole ? `${ws.name} WSMember` : isRptDirect ? "Direct Report Granted" : isWsDirect ? "Workspace Granted" : "Full Access (Default View)",
              targetType: isRptDirect ? "report" : isWsDirect ? "workspace" : null,
              targetId: isRptDirect ? rpt.id : isWsDirect ? ws.id : null,
              targetName: isRptDirect ? rpt.report_name : isWsDirect ? ws.name : null,
              isDirect: isRptDirect || isWsDirect,
            });
          } else {
            rptDisplayViews.forEach((dv: any) => {
              const isDefault = String(dv.displayview_name || "").toLowerCase() === String(rpt.report_name || "").toLowerCase();
              const isDvDirect = assignedDvIds.includes(Number(dv.id));
              const isRptDirect = assignedRptIds.includes(Number(rpt.id));
              const isWsDirect = assignedWsIds.includes(Number(ws.id));

              let targetType: "display_view" | "report" | "workspace" | null = null;
              let targetId: number | null = null;
              let targetName: string | null = null;

              if (isDvDirect) {
                targetType = "display_view";
                targetId = dv.id;
                targetName = dv.displayview_name;
              } else if (isRptDirect) {
                targetType = "report";
                targetId = rpt.id;
                targetName = rpt.report_name;
              } else if (isWsDirect) {
                targetType = "workspace";
                targetId = ws.id;
                targetName = ws.name;
              }

              rows.push({
                workspaceId: ws.id,
                reportId: rpt.id,
                displayViewId: dv.id,
                workspace: ws.name,
                report: rpt.report_name,
                view: dv.displayview_name + (isDefault ? " (Default View)" : ""),
                accessType: isAdmin ? "Admin (All Access)" : isSuperUser ? "Super User" : isWsMemberByRole ? `${ws.name} WSMember` : isDvDirect ? "Specific View Granted" : isRptDirect ? "Report Inherited View" : isWsDirect ? "Workspace Inherited View" : "Inherited View Access",
                targetType,
                targetId,
                targetName,
                isDirect: isDvDirect || isRptDirect || isWsDirect,
              });
            });
          }
        } else {
          // Rule 2: Specific view access only
          rptDisplayViews.forEach((dv: any) => {
            if (assignedDvIds.includes(Number(dv.id))) {
              rows.push({
                workspaceId: ws.id,
                reportId: rpt.id,
                displayViewId: dv.id,
                workspace: ws.name,
                report: rpt.report_name,
                view: dv.displayview_name,
                accessType: "Specific View Granted",
                targetType: "display_view",
                targetId: dv.id,
                targetName: dv.displayview_name,
                isDirect: true,
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
            <span className="text-[11px] font-semibold text-[#5c7f9f]">Roles</span>
            <span className="bg-[#eaf4fd] text-[#1890ff] font-bold text-[10px] px-2.5 py-1 rounded-full border border-[#c8dced]">
              {selectedUser.role || (selectedUser.is_admin ? "Admin" : "User")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#5c7f9f]">Status</span>
            <span className={`font-bold text-[10px] px-2.5 py-1 rounded-full ${selectedUser.is_active !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {selectedUser.is_active !== false ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      )}

      {/* Access Matrix Table matching Image 2 bottom */}
      <div className="overflow-x-auto rounded-lg border border-[#dce6f1]">
        <Table className="text-xs">
          <TableHeader className="bg-[#edf4fa]">
            <TableRow className="border-[#dce6f1]">
              <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5">Workspace</TableHead>
              <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5">Report</TableHead>
              <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5">View</TableHead>
              <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5">Access Grant Type</TableHead>
              <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5 text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowsToRender.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-[#5c7f9f]">
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
                  <TableCell>
                    <span className="bg-[#eaf4fd] text-[#1e5f99] px-2 py-0.5 rounded text-[10px] font-bold">
                      {row.accessType}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!row.targetType && !row.reportId && !row.workspaceId) {
                          toast.info(`Role-based access (${row.accessType}). Change user role in User Master to revoke.`);
                        } else {
                          setRemovingRow(row);
                        }
                      }}
                      title="Remove Access"
                      className="w-7 h-7 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-2xs rounded-lg inline-flex ml-auto"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!removingRow} onOpenChange={(open) => !open && setRemovingRow(null)}>
        <DialogContent className="max-w-md bg-white border border-[#c8dced] rounded-xl p-5 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0a1c30] flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Confirm Remove Access
            </DialogTitle>
          </DialogHeader>

          <div className="bg-[#fff1f0] border border-[#ffccc7] rounded-lg p-3.5 my-2 text-xs text-[#cf1322] font-medium">
            This will remove access to <strong>{removingRow?.targetName || removingRow?.view || removingRow?.report}</strong> everywhere for <strong>{selectedUser?.name}</strong>.
          </div>

          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setRemovingRow(null)}
              disabled={isRemoving}
              className="h-8 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRemove}
              disabled={isRemoving}
              className="h-8 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              {isRemoving ? "Removing..." : "Yes, Remove Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
