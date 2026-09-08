"use client";

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Shield, Folder, FileText, Eye, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { assignUsersToWorkspace } from "@/services/workspace-services";
import { assignUsersToReport, assignUsersToDisplayView } from "@/services/report-service";
import { toast } from "sonner";
import { useData } from "@/context/DataContext";

export default function ResourceAccess() {
  const {
    workspaces: cachedWorkspaces,
    users: cachedUsers,
    reports: cachedReports,
    displayViews: cachedDisplayViews,
    fetchWorkspaces: fetchWorkspacesCtx,
    fetchDisplayViews: fetchDisplayViewsCtx,
    fetchUsers: fetchUsersCtx,
    fetchReports: fetchReportsCtx,
  } = useData();

  const [workspaces, setWorkspaces] = useState<any[]>(cachedWorkspaces || []);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("all");
  
  const [reports, setReports] = useState<any[]>(cachedReports || []);
  const [displayViews, setDisplayViews] = useState<any[]>(cachedDisplayViews || []);
  const [allUsers, setAllUsers] = useState<any[]>(cachedUsers || []);

  const [isManageAccessOpen, setIsManageAccessOpen] = useState(false);
  const [targetType, setTargetType] = useState<"workspace" | "report" | "display_view">("workspace");
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const [wsList, rptList, dvList, userList] = await Promise.all([
        fetchWorkspacesCtx(),
        fetchReportsCtx(),
        fetchDisplayViewsCtx(),
        fetchUsersCtx(),
      ]);

      if (wsList.length > 0) {
        setWorkspaces(wsList);
        if (wsList.length > 0 && selectedWorkspaceId === "all") {
          setSelectedWorkspaceId(String(wsList[0].id));
        }
      }
      setReports(rptList);
      setDisplayViews(dvList);
      setAllUsers(userList);
    } catch (error) {
      console.error("Error fetching resource permission data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setWorkspaces(cachedWorkspaces || []);
    setReports(cachedReports || []);
    setDisplayViews(cachedDisplayViews || []);
    setAllUsers(cachedUsers || []);
  }, [cachedWorkspaces, cachedReports, cachedDisplayViews, cachedUsers]);

  const handleOpenManagePermission = (type: "workspace" | "report" | "display_view", target: any) => {
    setTargetType(type);
    setSelectedTarget(target);
    const existingUserIds = target.users ? target.users.map((u: any) => u.id) : [];
    setSelectedUserIds(existingUserIds);
    setUserSearchQuery("");
    setIsManageAccessOpen(true);
  };

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === allUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(allUsers.map(u => u.id));
    }
  };

  const handleSaveAccess = async () => {
    if (!selectedTarget?.id) return;
    setIsSavingAccess(true);
    try {
      let res;
      if (targetType === "workspace") {
        res = await assignUsersToWorkspace(selectedTarget.id, selectedUserIds);
      } else if (targetType === "report") {
        res = await assignUsersToReport(selectedTarget.id, selectedUserIds);
      } else if (targetType === "display_view") {
        res = await assignUsersToDisplayView(selectedTarget.id, selectedUserIds);
      }

      if (res?.status === 200 || res?.status === 201 || res?.success) {
        toast.success(`Access updated for ${selectedUserIds.length} users`);
        setIsManageAccessOpen(false);
        fetchData();
      } else {
        toast.error("Failed to assign permissions");
      }
    } catch (error) {
      toast.error("An error occurred while saving permissions");
    } finally {
      setIsSavingAccess(false);
    }
  };

  const currentWorkspace = workspaces.find(w => String(w.id) === selectedWorkspaceId);
  const workspaceReports = reports
    .filter(r => selectedWorkspaceId === "all" ? true : r.workspace?.id === Number(selectedWorkspaceId))
    .filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (r.report_name || "").toLowerCase().includes(q);
    });

  const filteredUsersForModal = allUsers.filter(u => {
    if (!userSearchQuery) return true;
    const q = userSearchQuery.toLowerCase();
    return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Workspace Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#dce6f1] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#eaf4fd] text-[#1890ff] flex items-center justify-center font-bold">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#5c7f9f] uppercase tracking-wider block">Workspace Filter</span>
            <h3 className="text-sm font-bold text-[#0a1c30]">Select Target Workspace</h3>
          </div>
        </div>

        <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
          <SelectTrigger className="w-64 h-9 text-xs border-[#c8dced] bg-white font-semibold text-[#0f2b48] shadow-2xs">
            <SelectValue placeholder="Select Workspace..." />
          </SelectTrigger>
          <SelectContent className="text-xs border-[#c8dced]">
            <SelectItem value="all">All Workspaces</SelectItem>
            {workspaces.map(ws => (
              <SelectItem key={ws.id} value={String(ws.id)}>
                {ws.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Workspace Permission Table */}
      <div className="bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[#0a1c30]">
              {currentWorkspace ? currentWorkspace.name : "All Reports & Workspace Permissions"}
            </h2>
            {currentWorkspace && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenManagePermission("workspace", currentWorkspace)}
                className="h-7 text-xs font-semibold text-[#1890ff] border-[#c8dced] hover:bg-[#eaf4fd] rounded-lg"
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Workspace Access ({currentWorkspace.users?.length || 0} Users)
              </Button>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="h-8 text-xs border-[#dce6f1] pl-8 bg-white"
            />
            <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Clean, Simplified Table */}
        <div className="overflow-x-auto rounded-xl border border-[#dce6f1]">
          <Table className="text-xs">
            <TableHeader className="bg-[#f0f6fc]">
              <TableRow className="border-[#dce6f1]">
                <TableHead className="text-[11px] font-bold text-[#0a1c30]">REPORT / ITEM</TableHead>
                <TableHead className="text-[11px] font-bold text-[#0a1c30]">TYPE</TableHead>
                <TableHead className="text-[11px] font-bold text-[#0a1c30] text-center">ASSIGNED USERS</TableHead>
                <TableHead className="text-[11px] font-bold text-[#0a1c30] text-right pr-6">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaceReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-[#5c7f9f]">
                    No reports found in this workspace.
                  </TableCell>
                </TableRow>
              ) : (
                workspaceReports.map((rpt: any) => {
                  // Only get custom views (skip redundant default view duplicate rows)
                  const customViews = displayViews.filter((dv: any) => 
                    dv.report?.id === rpt.id &&
                    String(dv.displayview_name || "").toLowerCase() !== String(rpt.report_name || "").toLowerCase() &&
                    String(dv.displayview_name || "").toLowerCase() !== "default view"
                  );
                  const rptUsersCount = rpt.users ? rpt.users.length : 0;

                  return (
                    <React.Fragment key={rpt.id}>
                      {/* Report Row */}
                      <TableRow className="border-[#dce6f1] hover:bg-[#f8fbfe]">
                        <TableCell className="font-bold text-[#0a1c30] flex items-center gap-2.5 py-3">
                          <div className="w-7 h-7 rounded-md bg-[#eaf4fd] text-[#1890ff] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#0a1c30]">{rpt.report_name}</span>
                            {rpt.workspace?.name && (
                              <span className="text-[10px] text-[#5c7f9f] font-normal">{rpt.workspace.name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[#5c7f9f]">
                          <span className="bg-[#f0f6fc] text-[#1890ff] px-2 py-0.5 rounded text-[10px] font-bold">
                            REPORT
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="bg-[#eaf4fd] text-[#1e5f99] px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{rptUsersCount} Users</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <Button
                            type="button"
                            onClick={() => handleOpenManagePermission("report", rpt)}
                            variant="outline"
                            className="h-7 text-xs font-bold text-[#1890ff] border-[#c8dced] hover:bg-[#eaf4fd] shadow-2xs"
                          >
                            Manage Access
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Custom Views Rows (Only rendered if actual custom display views exist) */}
                      {customViews.map((dv: any) => {
                        const dvUsersCount = dv.users ? dv.users.length : 0;
                        return (
                          <TableRow key={dv.id} className="border-[#dce6f1] bg-[#fdfefe] hover:bg-[#f6fafc]">
                            <TableCell className="pl-10 text-[#0f2b48] flex items-center gap-2 font-medium py-2.5">
                              <Eye className="w-3.5 h-3.5 text-[#2f8fe0]" />
                              <span>{dv.displayview_name}</span>
                            </TableCell>
                            <TableCell>
                              <span className="bg-[#f5f5f5] text-[#595959] px-2 py-0.5 rounded text-[10px] font-bold">
                                CUSTOM VIEW
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="bg-[#f5f5f5] text-[#595959] px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                {dvUsersCount} Users
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <Button
                                type="button"
                                onClick={() => handleOpenManagePermission("display_view", dv)}
                                variant="ghost"
                                className="h-6 text-xs font-bold text-[#1890ff] hover:bg-[#eaf4fd]"
                              >
                                Manage Access
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Permission Assignment Modal */}
      <Dialog open={isManageAccessOpen} onOpenChange={setIsManageAccessOpen}>
        <DialogContent className="max-w-md bg-white border border-[#c8dced] rounded-xl shadow-xl p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-[#edf3f9] bg-[#f8fbfe]">
            <DialogTitle className="text-sm font-bold text-[#0a1c30] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#1890ff]" />
              Manage Access - {selectedTarget?.name || selectedTarget?.report_name || selectedTarget?.displayview_name}
            </DialogTitle>
          </DialogHeader>

          {/* Search & Select All */}
          <div className="p-3 bg-[#f8fbfd] border-b border-[#edf3f9] flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Input
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search user name or email..."
                className="h-8 text-xs border-[#c8dced] pl-8 bg-white"
              />
              <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllUsers}
              className="h-8 text-xs font-semibold border-[#c8dced] text-[#1890ff] hover:bg-[#eaf4fd]"
            >
              {selectedUserIds.length === allUsers.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div className="p-4 max-h-[45vh] overflow-y-auto space-y-1.5">
            {filteredUsersForModal.length === 0 ? (
              <p className="text-xs text-center py-6 text-[#5c7f9f]">No users found.</p>
            ) : (
              filteredUsersForModal.map(user => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <label
                    key={user.id}
                    onClick={() => handleToggleUser(user.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#eaf4fd] border-[#1890ff]"
                        : "bg-white border-[#edf3f9] hover:bg-[#f8fbfd]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-[#c8dced] text-[#1890ff] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#0a1c30]">{user.name}</div>
                        <div className="text-[11px] text-[#5c7f9f]">{user.email}</div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#1890ff] border border-[#c8dced]">
                      {user.role || (user.is_admin ? "Admin" : "User")}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          <DialogFooter className="p-3.5 border-t border-[#edf3f9] bg-[#f8fbfe] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5c7f9f]">
              {selectedUserIds.length} users selected
            </span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsManageAccessOpen(false)}
                className="h-8 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAccess}
                disabled={isSavingAccess}
                className="h-8 text-xs font-semibold bg-[#1890ff] hover:bg-[#096dd9] text-white"
              >
                {isSavingAccess ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
