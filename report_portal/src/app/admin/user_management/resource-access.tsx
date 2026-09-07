"use client";

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Shield, Info, Check, Folder, FileText, Eye, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { findAllWorkspaces, assignUsersToWorkspace } from "@/services/workspace-services";
import { findAllReports, findAllDisplayViews, assignUsersToReport, assignUsersToDisplayView } from "@/services/report-service";
import { findAllusers } from "@/services/user-service";
import { toast } from "sonner";

export default function ResourceAccess() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("all");
  
  const [reports, setReports] = useState<any[]>([]);
  const [displayViews, setDisplayViews] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const [isManageAccessOpen, setIsManageAccessOpen] = useState(false);
  const [targetType, setTargetType] = useState<"workspace" | "report" | "display_view">("workspace");
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const [wsRes, rptRes, dvRes, userRes] = await Promise.all([
        findAllWorkspaces(),
        findAllReports(),
        findAllDisplayViews(),
        findAllusers(),
      ]);

      if (wsRes.status === 200) {
        const wsList = wsRes.data || [];
        setWorkspaces(wsList);
        if (wsList.length > 0 && selectedWorkspaceId === "all") {
          setSelectedWorkspaceId(String(wsList[0].id));
        }
      }
      if (rptRes.status === 200) setReports(rptRes.data || []);
      if (dvRes.status === 200) setDisplayViews(dvRes.data || []);
      if (userRes.status === 200) setAllUsers(userRes.data || []);
    } catch (error) {
      console.error("Error fetching resource permission data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        toast.success(`Assigned ${selectedUserIds.length} users successfully`);
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

  // Filter reports & views according to selected Workspace
  const currentWorkspace = workspaces.find(w => String(w.id) === selectedWorkspaceId);
  const workspaceReports = reports.filter(r => 
    selectedWorkspaceId === "all" ? true : r.workspace?.id === Number(selectedWorkspaceId)
  ).filter(r => {
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
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-[#dce6f1] shadow-2xs">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[#1890ff]" />
          <h3 className="text-xs font-bold text-[#0a1c30]">Select Workspace:</h3>
        </div>

        <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
          <SelectTrigger className="w-64 h-8 text-xs border-[#c8dced] bg-[#f8fbfe] font-semibold text-[#0f2b48]">
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

      {/* Main Workspace Permission Table matching Image 2 ("Sourcing Workspace") */}
      <div className="bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#0a1c30]">
              {currentWorkspace ? currentWorkspace.name : "Report Permission Hierarchy"}
            </h2>
            {currentWorkspace && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenManagePermission("workspace", currentWorkspace)}
                className="h-7 text-xs font-semibold text-[#1890ff] border-[#c8dced] hover:bg-[#eaf4fd]"
              >
                <Users className="w-3.5 h-3.5 mr-1" />
                Manage Workspace Permissions ({currentWorkspace.users?.length || 0} Users)
              </Button>
            )}
          </div>

          <div className="relative w-64">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="h-8 text-xs border-[#dce6f1] pl-8"
            />
            <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#dce6f1]">
          <Table className="text-xs">
            <TableHeader className="bg-[#edf4fa]">
              <TableRow className="border-[#dce6f1]">
                <TableHead className="text-[10px] font-bold text-[#0a1c30]">REPORT / VIEW NAME</TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30]">VIEW TYPE</TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30] text-center">ASSIGNED USERS</TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30] text-center">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaceReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-[#5c7f9f]">
                    No reports found for this workspace.
                  </TableCell>
                </TableRow>
              ) : (
                workspaceReports.map((rpt: any) => {
                  const rptDvs = displayViews.filter((dv: any) => dv.report?.id === rpt.id);
                  const rptUsersCount = rpt.users ? rpt.users.length : 0;

                  return (
                    <React.Fragment key={rpt.id}>
                      {/* Report Main Header Row */}
                      <TableRow className="bg-[#f8fbfe] border-[#dce6f1] hover:bg-[#eaf4fd]">
                        <TableCell className="font-bold text-[#0a1c30] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#1890ff]" />
                          <span>{rpt.report_name}</span>
                        </TableCell>
                        <TableCell className="text-[#5c7f9f] font-semibold text-[11px]">
                          Main Report Object
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="bg-[#eaf4fd] text-[#1e5f99] px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {rptUsersCount} Users
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            onClick={() => handleOpenManagePermission("report", rpt)}
                            variant="outline"
                            className="h-7 text-[11px] font-bold text-[#1890ff] border-[#c8dced] hover:bg-white shadow-2xs"
                          >
                            Manage Permission
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Display Views Rows under Report */}
                      {rptDvs.length === 0 ? (
                        <TableRow className="border-[#dce6f1]">
                          <TableCell className="pl-8 text-[#5c7f9f] flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5 text-[#8aa6bf]" />
                            <span>{rpt.report_name} (Default View)</span>
                          </TableCell>
                          <TableCell className="text-[#1890ff] font-bold text-[10px]">
                            DEFAULT VIEW
                          </TableCell>
                          <TableCell className="text-center text-[#8aa6bf] text-[11px]">Inherited</TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              onClick={() => handleOpenManagePermission("report", rpt)}
                              variant="ghost"
                              className="h-6 text-[11px] text-[#1890ff] hover:bg-[#eaf4fd]"
                            >
                              Manage Permission
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        rptDvs.map((dv: any) => {
                          const isDefault = String(dv.displayview_name || "").toLowerCase() === String(rpt.report_name || "").toLowerCase();
                          const dvUsersCount = dv.users ? dv.users.length : 0;

                          return (
                            <TableRow key={dv.id} className="border-[#dce6f1] hover:bg-[#f6fafc]">
                              <TableCell className="pl-8 text-[#0f2b48] flex items-center gap-2 font-medium">
                                <Eye className="w-3.5 h-3.5 text-[#8aa6bf]" />
                                <span>{dv.displayview_name}</span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isDefault ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                                  {isDefault ? "DEFAULT VIEW" : "CUSTOM VIEW"}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="bg-[#f0f6fc] text-[#335375] px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                  {dvUsersCount} Users
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  onClick={() => handleOpenManagePermission("display_view", dv)}
                                  variant="ghost"
                                  className="h-6 text-[11px] font-semibold text-[#1890ff] hover:bg-[#eaf4fd]"
                                >
                                  Manage Permission
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Multi-User Selection Modal matching batch assignment requirement */}
      <Dialog open={isManageAccessOpen} onOpenChange={setIsManageAccessOpen}>
        <DialogContent className="max-w-lg bg-white border border-[#c8dced] rounded-xl shadow-xl p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b border-[#edf3f9] bg-[#f8fbfe]">
            <DialogTitle className="text-sm font-bold text-[#0a1c30] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#1890ff]" />
              Manage Permissions: {selectedTarget?.name || selectedTarget?.report_name || selectedTarget?.displayview_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5c7f9f]">
              Select multiple users to grant access to this {targetType.replace('_', ' ')}.
            </DialogDescription>
          </DialogHeader>

          {/* User Search & Select All Controls */}
          <div className="p-4 bg-[#f8fbfd] border-b border-[#edf3f9] flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Input
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Filter users..."
                className="h-8 text-xs border-[#c8dced] pl-8 bg-white"
              />
              <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-2.5" />
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

          <div className="p-5 max-h-[50vh] overflow-y-auto space-y-2">
            {filteredUsersForModal.length === 0 ? (
              <p className="text-xs text-center py-6 text-[#5c7f9f]">No matching users found.</p>
            ) : (
              filteredUsersForModal.map(user => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <label
                    key={user.id}
                    onClick={() => handleToggleUser(user.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#eaf4fd] border-[#1890ff]"
                        : "bg-white border-[#edf3f9] hover:bg-[#f8fbfd]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by label click
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

          <DialogFooter className="p-4 border-t border-[#edf3f9] bg-[#f8fbfe] flex items-center justify-between">
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
