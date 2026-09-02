"use client";

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { findAllWorkspaces, assignUsersToWorkspace } from "@/services/workspace-services";
import { findAllReports, findAllDisplayViews, assignUsersToReport, assignUsersToDisplayView } from "@/services/report-service";
import { findAllusers } from "@/services/user-service";
import { toast } from "sonner";

export default function ResourceAccess() {
  const [activeResourceType, setActiveResourceType] = useState<"workspace" | "report" | "display_view">("workspace");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [displayViews, setDisplayViews] = useState<any[]>([]);
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isManageAccessOpen, setIsManageAccessOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const wsRes = await findAllWorkspaces();
      if (wsRes.status === 200) setWorkspaces(wsRes.data || []);

      const rptRes = await findAllReports();
      if (rptRes.status === 200) setReports(rptRes.data || []);

      const dvRes = await findAllDisplayViews();
      if (dvRes.status === 200) setDisplayViews(dvRes.data || []);

      const userRes = await findAllusers();
      if (userRes.status === 200) setAllUsers(userRes.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManageAccess = (resource: any) => {
    setSelectedResource(resource);
    const existingUserIds = resource.users ? resource.users.map((u: any) => u.id) : [];
    setSelectedUserIds(existingUserIds);
    setIsManageAccessOpen(true);
  };

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSaveAccess = async () => {
    if (!selectedResource?.id) return;
    setIsSavingAccess(true);
    try {
      let res;
      if (activeResourceType === "workspace") {
        res = await assignUsersToWorkspace(selectedResource.id, selectedUserIds);
      } else if (activeResourceType === "report") {
        res = await assignUsersToReport(selectedResource.id, selectedUserIds);
      } else if (activeResourceType === "display_view") {
        res = await assignUsersToDisplayView(selectedResource.id, selectedUserIds);
      }

      if (res?.status === 200 || res?.status === 201) {
        toast.success("Users assigned successfully");
        setIsManageAccessOpen(false);
        fetchData();
      } else {
        toast.error("Failed to assign users");
      }
    } catch (error) {
      toast.error("An error occurred while assigning users");
    } finally {
      setIsSavingAccess(false);
    }
  };

  const getFilteredData = () => {
    let data: any[] = [];
    if (activeResourceType === "workspace") data = workspaces;
    if (activeResourceType === "report") data = reports;
    if (activeResourceType === "display_view") data = displayViews;

    if (!searchQuery) return data;
    const lowerQ = searchQuery.toLowerCase();
    return data.filter(item => {
      const name = item.name || item.report_name || item.displayview_name || "";
      return name.toLowerCase().includes(lowerQ);
    });
  };

  const dataToRender = getFilteredData();

  return (
    <div className="bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button 
            variant={activeResourceType === "workspace" ? "default" : "outline"}
            onClick={() => setActiveResourceType("workspace")}
            className={`h-8 text-xs ${activeResourceType === "workspace" ? "bg-[#1890ff] hover:bg-[#096dd9]" : "text-[#335375]"}`}
          >
            Workspaces
          </Button>
          <Button 
            variant={activeResourceType === "report" ? "default" : "outline"}
            onClick={() => setActiveResourceType("report")}
            className={`h-8 text-xs ${activeResourceType === "report" ? "bg-[#1890ff] hover:bg-[#096dd9]" : "text-[#335375]"}`}
          >
            Reports
          </Button>
          <Button 
            variant={activeResourceType === "display_view" ? "default" : "outline"}
            onClick={() => setActiveResourceType("display_view")}
            className={`h-8 text-xs ${activeResourceType === "display_view" ? "bg-[#1890ff] hover:bg-[#096dd9]" : "text-[#335375]"}`}
          >
            Display Views
          </Button>
        </div>
        <div className="relative w-64">
          <Input 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Search resources..." 
            className="h-8 text-xs border-[#dce6f1] pl-8" 
          />
          <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-2.5" />
        </div>
      </div>

      <div className="overflow-x-auto w-full flex-1">
        <Table className="text-xs">
          <TableHeader className="bg-[#edf4fa]">
            <TableRow className="border-[#dce6f1]">
              <TableHead className="text-[10px] font-bold text-[#0a1c30]">RESOURCE NAME</TableHead>
              <TableHead className="text-[10px] font-bold text-[#0a1c30]">DESCRIPTION / CONTEXT</TableHead>
              <TableHead className="text-[10px] font-bold text-[#0a1c30] text-center">ASSIGNED USERS</TableHead>
              <TableHead className="text-center text-[10px] font-bold text-[#0a1c30]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataToRender.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-[#5c7f9f]">No resources found.</TableCell></TableRow>
            ) : (
              dataToRender.map((item: any) => {
                const name = item.name || item.report_name || item.displayview_name;
                const desc = item.description || (item.workspace ? `Belongs to ${item.workspace.name}` : (item.report ? `Belongs to ${item.report.report_name}` : "-"));
                const usersCount = item.users ? item.users.length : 0;
                
                return (
                  <TableRow key={item.id} className="border-[#dce6f1] hover:bg-[#f6fafc]">
                    <TableCell className="font-semibold text-[#0f2b48]">{name}</TableCell>
                    <TableCell className="text-[#5c7f9f]">{desc}</TableCell>
                    <TableCell className="text-center">
                      <span className="bg-[#eaf4fd] text-[#1e5f99] px-2 py-1 rounded-full text-[10px] font-bold">
                        {usersCount} Users
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        onClick={() => handleManageAccess(item)}
                        variant="outline"
                        className="h-7 text-[11px] font-semibold text-[#1890ff] border-[#c8dced] hover:bg-[#eaf4fd] transition-colors"
                      >
                        Manage Access
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isManageAccessOpen} onOpenChange={setIsManageAccessOpen}>
        <DialogContent className="max-w-md bg-white border border-[#c8dced] rounded-xl shadow-lg p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b border-[#edf3f9] bg-[#f8fbfe]">
            <DialogTitle className="text-sm font-bold text-[#0a1c30] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2f8fe0]" />
              Manage Access: {selectedResource?.name || selectedResource?.report_name || selectedResource?.displayview_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5c7f9f]">
              Select users who should have access to this resource.
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {allUsers.length === 0 ? (
              <p className="text-xs text-center text-[#5c7f9f]">No users found.</p>
            ) : (
              <div className="space-y-2">
                {allUsers.map(user => (
                  <label key={user.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#edf3f9] hover:bg-[#f6f9fc] cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-[#2f8fe0]"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleToggleUser(user.id)}
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#0d2745]">{user.name}</div>
                      <div className="text-[10px] text-[#5c7f9f]">{user.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="p-4 border-t border-[#edf3f9] bg-[#f8fbfe] flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsManageAccessOpen(false)} className="h-8 text-xs">Cancel</Button>
            <Button onClick={handleSaveAccess} disabled={isSavingAccess} className="h-8 text-xs bg-[#1890ff] hover:bg-[#096dd9]">
              {isSavingAccess ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
