"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createUser, deleteUser, findAllusers, findAllRoles, bulkAllocateUsers } from "@/services/user-service";
import { findAllWorkspaces } from "@/services/workspace-services";
import { searchADUsers } from "@/services/authentication-service";
import { findAllDisplayViews } from "@/services/report-service";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Search, UserCheck, ChevronLeft, ChevronRight, ChevronDown, Users, X, Check, Shield, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useData } from "@/context/DataContext";

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Full name is required"),
  role: z.string().min(1, "At least one role must be selected"),
});

const UserMaster = () => {
  const {
    users,
    workspaces: rawWorkspaces,
    roles: rolesList,
    displayViews: allDisplayViews,
    loadingUsers,
    fetchUsers: fetchUsersCtx,
    fetchWorkspaces: fetchWorkspacesCtx,
    fetchAllData: fetchAllDataCtx,
  } = useData();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Wizard Modal State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<number[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);
  const [selectedDisplayViewIds, setSelectedDisplayViewIds] = useState<number[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkSelectedUserIds, setBulkSelectedUserIds] = useState<number[]>([]);

  // Memoized O(1) Lookups for instant UI responsiveness
  const displayViewsByReportId = useMemo(() => {
    const map: Record<number, any[]> = {};
    (allDisplayViews || []).forEach((dv: any) => {
      const rId = dv.report?.id;
      if (rId) {
        if (!map[rId]) map[rId] = [];
        map[rId].push(dv);
      }
    });
    return map;
  }, [allDisplayViews]);

  const selectedWsSet = useMemo(() => new Set(selectedWorkspaceIds), [selectedWorkspaceIds]);
  const selectedRptSet = useMemo(() => new Set(selectedReportIds), [selectedReportIds]);
  const selectedDvSet = useMemo(() => new Set(selectedDisplayViewIds), [selectedDisplayViewIds]);

  // Existing Users Pagination & Search state
  const [tableSearch, setTableSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  useEffect(() => {
    const updatePageSize = () => {
      const h = window.innerHeight;
      if (h >= 1050) {
        setPageSize(14);
      } else if (h >= 900) {
        setPageSize(10);
      } else if (h >= 750) {
        setPageSize(8);
      } else {
        setPageSize(6);
      }
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  // AD Suggestions state
  const [adSuggestions, setAdSuggestions] = useState<any[]>([]);
  const [isSearchingAD, setIsSearchingAD] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchTimeoutRef = useRef<any>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Custom multi-select roles state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);

  const form = useForm<any>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: "", name: "", role: "" },
  });

  useEffect(() => {
    fetchAllDataCtx();
  }, []);

  const fetchUsers = async () => {
    await fetchUsersCtx(true);
  };

  const fetchWorkspaces = async () => {
    await fetchWorkspacesCtx(true);
  };

  const formatNameFromEmail = (emailStr: string) => {
    if (!emailStr) return "";
    const prefix = emailStr.split("@")[0] || "";
    if (!prefix) return "";
    return prefix
      .split(/[._-]/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleEmailChange = (val: string, fieldChange: (val: string) => void) => {
    fieldChange(val);

    // Auto-populate User Name from email if User Name hasn't been custom typed or matches previous auto-fill
    const autoDerivedName = formatNameFromEmail(val);
    if (autoDerivedName) {
      form.setValue("name", autoDerivedName, { shouldValidate: true });
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val || val.trim().length < 2) {
      setAdSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearchingAD(true);
        const res: any = await searchADUsers(val);
        const list = res.data || [];
        setAdSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch (err) { console.error("AD search error:", err); } 
      finally { setIsSearchingAD(false); }
    }, 350);
  };

  const handleSelectADUser = (adUser: any) => {
    form.setValue("email", adUser.email, { shouldValidate: true });
    form.setValue("name", adUser.name, { shouldValidate: true });
    setShowSuggestions(false);
    toast.success(`Loaded credentials for ${adUser.name}`);
  };

  // STEP 1: Add User Form submission -> Opens Step 2 Modal
  const onProceedToPermissions = (data: any) => {
    const role = selectedRoles.join(", ");
    form.setValue("role", role, { shouldValidate: true });
    data = { ...data, role };
    const isAdm = selectedRoles.some(r => r.toLowerCase() === "admin");
    if (isAdm) {
       // Admins get everything, skip modal
       submitUserToBackend(data, [], [], []);
    } else {
       // Open the wizard
       setIsAccessModalOpen(true);
    }
  };

  // STEP 2: Submit to backend
  const submitUserToBackend = async (data: any, wsIds: number[], rptIds: number[], dvIds: number[]) => {
    try {
      const role = selectedRoles.join(", ") || data.role || "User";
      const roleArray = role.split(',').map((r: string) => r.trim().toLowerCase());
      const isAdm = roleArray.includes("admin");
      const payload: any = {
        id: selectedUser?.id || undefined,
        name: data.name.trim(),
        email: data.email.trim(),
        role,
        is_admin: isAdm,
        is_active: isActive,
        workspaceIds: isAdm ? [] : [...new Set(wsIds.map(Number))],
        reportIds: isAdm ? [] : [...new Set(rptIds.map(Number))],
        displayviewIds: isAdm ? [] : [...new Set(dvIds.map(Number))],
      };

      const res: any = await createUser(payload);
      if (res.status === 200 || res.status === 201 || res?.data || res?.id) {
        toast.success(selectedUser ? "User updated successfully" : "User added successfully");
        await fetchUsers();
        handleCancel();
        setIsAccessModalOpen(false);
      } else {
        toast.error("User save failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save user");
    }
  };

  // STEP 2 BULK: Submit bulk allocations
  const submitBulkToBackend = async (wsIds: number[], rptIds: number[], dvIds: number[]) => {
    try {
      const res = await bulkAllocateUsers({
        userIds: bulkSelectedUserIds,
        workspaceIds: wsIds,
        reportIds: rptIds,
        displayviewIds: dvIds,
      });
      if (res.status === 200 || res.status === 201 || res?.success) {
        toast.success(`Access updated for ${bulkSelectedUserIds.length} users`);
        fetchUsers();
        setBulkSelectedUserIds([]);
        setIsAccessModalOpen(false);
      } else {
        toast.error("Bulk save failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to bulk save");
    }
  };

  const handleEditUser = (u: any) => {
    setSelectedUser(u);
    const rolesArray = (u.role || (u.is_admin ? "Admin" : "")).split(",").filter((r:string) => r.trim() !== "");
    setSelectedRoles(rolesArray);
    setIsActive(u.is_active !== false);
    
    form.reset({
      email: u.email || "",
      name: u.name || "",
      role: u.role || (u.is_admin ? "Admin" : ""),
    });

    const userWsIds = (u.workspaces || []).map((w: any) => w.id);
    const userRptIds = (u.reports || []).map((r: any) => r.id);
    const userDvIds = (u.displayviews || []).map((dv: any) => dv.id);

    setSelectedWorkspaceIds(userWsIds);
    setSelectedReportIds(userRptIds);
    setSelectedDisplayViewIds(userDvIds);
    setIsBulkMode(false);
    setIsAccessModalOpen(true);
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setSelectedRoles([]);
    setIsActive(true);
    form.reset({ email: "", name: "", role: "" });
    setSelectedWorkspaceIds([]);
    setSelectedReportIds([]);
    setSelectedDisplayViewIds([]);
    setAdSuggestions([]);
    setShowSuggestions(false);
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const res = await deleteUser(id);
      if (res.status === 200 || res.status === 201) {
        toast.success("User deleted");
        fetchUsers();
      }
    } catch (error) { toast.error("Failed to delete user"); }
  };

  const [expandedWorkspacesInModal, setExpandedWorkspacesInModal] = useState<Record<number, boolean>>({});
  const [expandedReportViewsInModal, setExpandedReportViewsInModal] = useState<Record<number, boolean>>({});

  const toggleWorkspaceExpand = (wsId: number) => {
    setExpandedWorkspacesInModal(prev => ({ ...prev, [wsId]: !prev[wsId] }));
  };

  const toggleReportViewsExpand = (rptId: number) => {
    setExpandedReportViewsInModal(prev => ({ ...prev, [rptId]: !prev[rptId] }));
  };

  // Checkbox handlers for the Modal Grid
  const handleToggleWorkspace = (wsId: number) => {
     const ws = rawWorkspaces.find((w: any) => w.id === wsId);
     if (!ws) return;

     const wsReports = ws.reports || [];
     const wsReportIds = wsReports.map((r: any) => r.id);
     const wsViewIds: number[] = [];
     wsReports.forEach((r: any) => {
       wsViewIds.push(0 - r.id);
       const customDvs = displayViewsByReportId[r.id] || [];
       customDvs.forEach((dv: any) => wsViewIds.push(dv.id));
     });

     const isExplicit = selectedWsSet.has(wsId);
     const hasReportsSelected = wsReportIds.some((rId: number) => selectedRptSet.has(rId));
     const hasViewsSelected = wsViewIds.some((vId: number) => selectedDvSet.has(vId));
     const isCurrentlyActive = isExplicit || hasReportsSelected || hasViewsSelected;

     if (isCurrentlyActive) {
        const wsRptSet = new Set(wsReportIds);
        const wsVSet = new Set(wsViewIds);
        setSelectedWorkspaceIds(prev => prev.filter((id: number) => id !== wsId));
        setSelectedReportIds(prev => prev.filter((id: number) => !wsRptSet.has(id)));
        setSelectedDisplayViewIds(prev => prev.filter((id: number) => !wsVSet.has(id)));
     } else {
        setSelectedWorkspaceIds(prev => [...new Set([...prev, wsId])]);
        setSelectedReportIds(prev => [...new Set([...prev, ...wsReportIds])]);
        setSelectedDisplayViewIds(prev => [...new Set([...prev, ...wsViewIds])]);
     }
  };
  
  const handleToggleReport = (rptId: number, wsId: number) => {
     const customDvs = displayViewsByReportId[rptId] || [];
     const rptViews = [0 - rptId, ...customDvs.map((dv: any) => dv.id)];

     const isCurrentlyActive = selectedRptSet.has(rptId) || selectedWsSet.has(wsId);

     if (isCurrentlyActive) {
        const rptVSet = new Set(rptViews);
        setSelectedReportIds(prev => prev.filter((id: number) => id !== rptId));
        setSelectedDisplayViewIds(prev => prev.filter((id: number) => !rptVSet.has(id)));
     } else {
        setSelectedReportIds(prev => [...new Set([...prev, rptId])]);
        setSelectedDisplayViewIds(prev => [...new Set([...prev, ...rptViews])]);
     }
  };

  const handleToggleView = (dvId: number, reportId: number) => {
     if (selectedDvSet.has(dvId)) {
         setSelectedDisplayViewIds(prev => prev.filter((id: number) => id !== dvId));
     } else {
         setSelectedDisplayViewIds(prev => [...new Set([...prev, dvId])]);
     }
  };

  const filteredUsers = users.filter((u: any) => {
    if (!tableSearch.trim()) return true;
    const query = tableSearch.toLowerCase().trim();
    const nameMatch = (u.name || "").toLowerCase().includes(query);
    const emailMatch = (u.email || "").toLowerCase().includes(query);
    const roleMatch = (u.role || (u.is_admin ? "Admin" : "")).toLowerCase().includes(query);
    return nameMatch || emailMatch || roleMatch;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
      
      {/* Left Column: User Form */}
      <div className="xl:col-span-4 bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#edf3f9]">
          <div className="w-8 h-8 rounded-lg bg-[#eaf4fd] text-[#2f8fe0] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-[#0a1c30]">
              {selectedUser ? `Edit User` : "Add New User"}
            </h2>
            <p className="text-[11px] text-[#5c7f9f]">Configure details and assign system roles</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onProceedToPermissions)} className="space-y-4">
            
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem className="relative" ref={suggestionsRef}>
                <FormLabel className="text-[12px] font-bold text-[#0d2745] flex items-center justify-between">
                  <span>Email</span>
                  {isSearchingAD && <span className="text-[11px] text-[#2f8fe0]"><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Searching AD</span>}
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    onChange={(e) => handleEmailChange(e.target.value, field.onChange)} 
                    placeholder="Type user email (e.g. john.doe@hgusa.com)..." 
                    className="h-8 text-xs border-[#dce6f1] rounded-md shadow-2xs focus-visible:ring-[#2f8fe0]" 
                  />
                </FormControl>
                
                {showSuggestions && adSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-[#dce6f1] rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {adSuggestions.map((adUser: any, idx: number) => (
                      <div key={idx} onClick={() => handleSelectADUser(adUser)} className="p-2 hover:bg-[#eaf4fd] cursor-pointer border-b border-[#edf3f9]">
                        <div className="font-semibold text-xs">{adUser.name}</div>
                        <div className="text-[11px] text-[#5c7f9f]">{adUser.email}</div>
                      </div>
                    ))}
                  </div>
                )}
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-bold text-[#0d2745]">User Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Auto-populated from email or AD" className="h-8 text-xs bg-[#f6f9fc] focus:bg-white border-[#dce6f1] rounded-md shadow-2xs" />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <FormField control={form.control} name="role" render={() => (
              <FormItem>
                <FormLabel className="text-[12px] font-bold text-[#0d2745]">User Roles</FormLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="outline" className="w-full h-8 text-xs justify-start border-[#dce6f1] font-normal">
                        {selectedRoles.length > 0 ? selectedRoles.join(", ") : "Select user roles"}
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full min-w-[250px] max-h-60 overflow-y-auto text-xs">
                     {rolesList.map(role => (
                        <DropdownMenuCheckboxItem 
                          key={role.id} 
                          checked={selectedRoles.includes(role.role)} 
                          onCheckedChange={(checked) => {
                              const nextRoles = checked
                               ? [...selectedRoles, role.role]
                               : selectedRoles.filter(r => r !== role.role);
                              setSelectedRoles(nextRoles);
                              form.setValue("role", nextRoles.join(", "), { shouldValidate: true });
                          }}>
                           {role.role}
                        </DropdownMenuCheckboxItem>
                     ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            <div className="flex items-center gap-2 pt-2">
               <input 
                 type="checkbox" 
                 id="isActive" 
                 checked={isActive} 
                 onChange={(e) => setIsActive(e.target.checked)} 
                 className="rounded border-[#c8dced] text-[#2f8fe0] focus:ring-[#2f8fe0] w-4 h-4 cursor-pointer" 
               />
               <label htmlFor="isActive" className="text-[12px] font-bold text-[#0d2745] cursor-pointer">Is Active</label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#edf3f9]">
              <Button type="button" variant="outline" onClick={handleCancel} className="h-8 text-xs px-4 rounded-md border-[#dce6f1] text-[#335375]">Clear</Button>
              <Button type="submit" className="h-8 text-xs px-5 rounded-md bg-[#0e2947] hover:bg-[#163e6b] text-white font-semibold">
                {selectedRoles.some(r => r.toLowerCase() === "admin") ? "Save User" : "Next"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right Column: Existing Users */}
      <div className="xl:col-span-8 bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#edf3f9]">
          <h2 className="text-[13px] font-bold text-[#0a1c30]">Existing Users</h2>
          <div className="flex items-center gap-3">
            {bulkSelectedUserIds.length > 0 && (
              <Button 
                onClick={() => {
                  setIsBulkMode(true);
                  setSelectedWorkspaceIds([]);
                  setSelectedReportIds([]);
                  setSelectedDisplayViewIds([]);
                  setIsAccessModalOpen(true);
                }} 
                className="h-8 text-xs bg-[#2f8fe0] hover:bg-[#1e5f99] text-white rounded-md"
              >
                Manage Access ({bulkSelectedUserIds.length})
              </Button>
            )}
            <div className="relative w-64">
              <Input value={tableSearch} onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }} placeholder="Search users..." className="h-8 text-xs border-[#dce6f1] pl-8" />
              <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <Table className="text-xs">
            <TableHeader className="bg-[#edf4fa]">
              <TableRow className="border-[#dce6f1]">
                <TableHead className="w-[40px] text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-[#c8dced] text-[#2f8fe0]" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkSelectedUserIds(paginatedUsers.map(u => u.userid || u.id));
                      } else {
                        setBulkSelectedUserIds([]);
                      }
                    }}
                    checked={paginatedUsers.length > 0 && bulkSelectedUserIds.length === paginatedUsers.length}
                  />
                </TableHead>
                <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5">Full Name</TableHead>
                <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5">Email</TableHead>
                <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5">User Roles</TableHead>
                <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5">Assigned Workspaces & Reports</TableHead>
                <TableHead className="text-center text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-[#5c7f9f]">No users found.</TableCell></TableRow>
              ) : (
                paginatedUsers.map((u: any) => {
                  const roles = (u.role || "").split(",").filter((r:string)=>r.trim()!=="");
                  const wsCount = (u.workspaces || []).length;
                  const rptCount = (u.reports || []).length;
                  const isAdm = roles.some((r:string) => r.toLowerCase() === "admin") || u.is_admin;
                  
                  return (
                    <TableRow key={u.id} className="border-[#dce6f1]">
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-[#c8dced] text-[#2f8fe0]"
                          checked={bulkSelectedUserIds.includes(u.userid || u.id)}
                          onChange={(e) => {
                            const uid = u.userid || u.id;
                            if (e.target.checked) {
                              setBulkSelectedUserIds(prev => [...prev, uid]);
                            } else {
                              setBulkSelectedUserIds(prev => prev.filter(id => id !== uid));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-[#0f2b48]">{u.name}</TableCell>
                      <TableCell className="text-[#5c7f9f]">{u.email}</TableCell>
                      <TableCell>
                         <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {roles.length > 0 ? roles.map((r:string, i:number) => (
                               <span key={i} className="px-1.5 py-0.5 rounded-md bg-[#eaf4fd] text-[#1e5f99] border border-[#c8dced] text-[9px]">{r}</span>
                            )) : <span className="text-[#8aa6bf] italic">None</span>}
                         </div>
                      </TableCell>
                      <TableCell>
                         {isAdm ? (
                            <span className="text-[10px] font-bold text-[#2f8fe0]">All Access (Admin)</span>
                         ) : (
                            <div className="text-[10px] text-[#5c7f9f]">
                               {wsCount > 0 ? `${wsCount} Workspace(s)` : ""}
                               {wsCount > 0 && rptCount > 0 ? ", " : ""}
                               {rptCount > 0 ? `${rptCount} Report(s)` : ""}
                               {wsCount === 0 && rptCount === 0 ? "No assignments" : ""}
                            </div>
                         )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleEditUser(u)}
                            className="text-[#2f8fe0] hover:text-[#1e5f99] border border-[#a6d4fa] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 bg-[#f0f6fc] hover:bg-[#e1f0fc] px-2 py-1 rounded shadow-sm"
                          >
                            <UserPlus className="w-3 h-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.userid || u.id)}
                            className="text-red-500 hover:text-red-700 border border-red-200 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-1 rounded shadow-sm"
                          >
                            <X className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#edf3f9] text-[11px]">
            <span className="text-[#5c7f9f]">Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredUsers.length)} of {filteredUsers.length}</span>
            <div className="flex gap-1.5">
               <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safeCurrentPage <= 1} className="h-7 text-xs"><ChevronLeft className="w-3.5 h-3.5" /></Button>
               <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={safeCurrentPage >= totalPages} className="h-7 text-xs"><ChevronRight className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Permissions Wizard Modal */}
      <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-xl border-[#dce6f1]">
          <DialogHeader className="p-5 border-b border-[#edf3f9] bg-[#f9fbff]">
            <DialogTitle className="text-[15px] font-bold text-[#0a1c30]">User Management</DialogTitle>
            <DialogDescription className="hidden">
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-5 bg-white">
             {rawWorkspaces.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#8aa6bf]">No workspaces available.</div>
             ) : (
                <div className="border border-[#dce6f1] rounded-lg overflow-hidden shadow-2xs">
                   <Table className="text-xs">
                      <TableHeader className="bg-[#edf4fa] sticky top-0 z-10">
                         <TableRow className="border-[#dce6f1]">
                            <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5 w-[30%]">Workspace</TableHead>
                            <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5 w-[30%]">Reports</TableHead>
                            <TableHead className="text-[13px] font-bold text-[#0a1c30] h-12 py-3.5 px-3.5 w-[40%]">Views</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {rawWorkspaces.map((ws: any) => {
                            const wsReports = ws.reports || [];
                            const wsReportIds = wsReports.map((r: any) => r.id);
                            const wsAllViewIds = wsReports.flatMap((r: any) => [
                              0 - r.id,
                              ...allDisplayViews.filter((dv: any) => dv.report?.id === r.id).map((dv: any) => dv.id)
                            ]);

                            const isWsExplicit = selectedWorkspaceIds.includes(ws.id);
                            const hasAnyReportSelectedInWs = wsReportIds.some((rId: number) => selectedReportIds.includes(rId));
                            const hasAnyViewSelectedInWs = wsAllViewIds.some((vId: number) => selectedDisplayViewIds.includes(vId));

                            const isWsChecked = isWsExplicit;
                            const isWsDisabled = hasAnyReportSelectedInWs || hasAnyViewSelectedInWs;
                            const isWsExpanded = expandedWorkspacesInModal[ws.id] === true;

                            return (
                               <React.Fragment key={ws.id}>
                                  <TableRow className="bg-[#fcfdfef0] border-[#dce6f1] hover:bg-[#f6fafc]">
                                     <TableCell colSpan={3} className="p-0">
                                        {/* Workspace Row Bar */}
                                        <div className="flex items-center justify-between p-3.5 bg-[#f6fafc] border-b border-[#edf3f9]">
                                           <div className="flex items-center gap-2.5">
                                              <button
                                                 type="button"
                                                 onClick={() => toggleWorkspaceExpand(ws.id)}
                                                 className="p-1 hover:bg-[#e4eff8] rounded-md transition-colors text-[#5c7f9f] cursor-pointer"
                                                 title={isWsExpanded ? "Collapse Reports" : "Expand Reports"}
                                              >
                                                 {isWsExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-[#2f8fe0]" />
                                                 ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                 )}
                                              </button>
                                              <input
                                                 type="checkbox"
                                                 checked={isWsChecked}
                                                 disabled={isWsDisabled}
                                                 onChange={() => handleToggleWorkspace(ws.id)}
                                                 className="rounded border-[#c8dced] text-[#2f8fe0] disabled:opacity-80 cursor-pointer"
                                              />
                                              <span className="font-bold text-[#0a1c30] text-[13px]">{ws.name}</span>
                                           </div>
                                           <span className="text-[10px] font-bold bg-[#edf4fa] text-[#1e5f99] px-2.5 py-0.5 rounded-full border border-[#dce6f1]">
                                              {wsReports.length} {wsReports.length === 1 ? 'Report' : 'Reports'}
                                           </span>
                                        </div>

                                        {/* Collapsible Reports & Views List */}
                                        {isWsExpanded && (
                                           <div className="flex flex-col w-full bg-white divide-y divide-[#edf3f9]">
                                              {wsReports.length === 0 ? (
                                                 <div className="p-4 pl-12 text-[#8aa6bf] italic text-xs">No reports in this workspace</div>
                                              ) : (
                                                 wsReports.map((rpt: any) => {
                                                    const customDvs = displayViewsByReportId[rpt.id] || [];
                                                    const rptViews = [
                                                       { id: 0 - rpt.id, name: rpt.report_name, isDefault: true },
                                                       ...customDvs.map((dv: any) => ({ id: dv.id, name: dv.displayview_name, isDefault: false }))
                                                    ];
                                                    
                                                    const isParentWsChecked = selectedWsSet.has(ws.id);
                                                    const isRptExplicit = selectedRptSet.has(rpt.id);
                                                    const isRptChecked = isRptExplicit || isParentWsChecked;
                                                    const isRptDisabled = isParentWsChecked;

                                                    return (
                                                       <div key={rpt.id} className="flex items-start p-3 hover:bg-[#fbfdff] transition-colors border-b border-[#edf3f9]">
                                                          {/* Workspace Column Spacer */}
                                                          <div className="w-[30%] pl-8" />

                                                          {/* Reports Column */}
                                                          <div className="w-[35%] flex items-center gap-2.5 pr-3">
                                                             <input
                                                                type="checkbox"
                                                                checked={isRptChecked}
                                                                disabled={isRptDisabled}
                                                                onChange={() => handleToggleReport(rpt.id, ws.id)}
                                                                className="rounded border-[#c8dced] text-[#2f8fe0] disabled:opacity-80 cursor-pointer"
                                                             />
                                                             <span className="font-semibold text-[#0a1c30] text-[12px] truncate" title={rpt.report_name}>
                                                                {rpt.report_name}
                                                             </span>
                                                          </div>

                                                          {/* Views Column */}
                                                          <div className="w-[35%] flex flex-col gap-1.5">
                                                             {rptViews.map((v: any) => (
                                                                <label key={v.id} className="flex items-center gap-2 cursor-pointer group py-0.5 select-none">
                                                                   <input
                                                                      type="checkbox"
                                                                      checked={selectedDvSet.has(v.id)}
                                                                      onChange={() => handleToggleView(v.id, rpt.id)}
                                                                      className="rounded border-[#c8dced] text-[#2f8fe0] cursor-pointer"
                                                                   />
                                                                   <span className="text-[11px] font-medium text-[#0a1c30] group-hover:text-[#2f8fe0] transition-colors truncate">
                                                                      {v.name}
                                                                   </span>
                                                                </label>
                                                             ))}
                                                          </div>
                                                       </div>
                                                    );
                                                 })
                                              )}
                                           </div>
                                        )}
                                     </TableCell>
                                  </TableRow>
                               </React.Fragment>
                            );
                         })}
                      </TableBody>
                   </Table>
                </div>
             )}
          </div>

          <DialogFooter className="p-4 border-t border-[#edf3f9] bg-[#f9fbff]">
            <Button variant="outline" onClick={() => setIsAccessModalOpen(false)} className="text-xs h-8">Cancel</Button>
            <Button onClick={() => {
              if (isBulkMode) {
                submitBulkToBackend(selectedWorkspaceIds, selectedReportIds, selectedDisplayViewIds.filter(id => id > 0));
              } else {
                submitUserToBackend(form.getValues(), selectedWorkspaceIds, selectedReportIds, selectedDisplayViewIds.filter(id => id > 0));
              }
            }} className="bg-[#0e2947] hover:bg-[#163e6b] text-white text-xs h-8 px-6 font-semibold">Finished</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserMaster;
