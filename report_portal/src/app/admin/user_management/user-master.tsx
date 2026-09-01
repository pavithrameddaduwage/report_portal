"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createUser, deleteUser, findAllusers, findAllRoles } from "@/services/user-service";
import { findAllWorkspaces } from "@/services/workspace-services";
import { searchADUsers } from "@/services/authentication-service";
import { findAllDisplayViews } from "@/services/report-service";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Search, UserCheck, ChevronLeft, ChevronRight, Users, X, Check, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Full name is required"),
  role: z.string().min(1, "At least one role must be selected"),
});

const UserMaster = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rawWorkspaces, setRawWorkspaces] = useState<any[]>([]);
  const [allDisplayViews, setAllDisplayViews] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  
  // Wizard Modal State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<number[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);
  const [selectedDisplayViewIds, setSelectedDisplayViewIds] = useState<number[]>([]);

  // Existing Users Pagination & Search state
  const [tableSearch, setTableSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 6;

  // AD Suggestions state
  const [adSuggestions, setAdSuggestions] = useState<any[]>([]);
  const [isSearchingAD, setIsSearchingAD] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchTimeoutRef = useRef<any>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Custom multi-select roles state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const form = useForm<any>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: "", name: "", role: "" },
  });

  useEffect(() => {
    fetchUsers();
    fetchWorkspaces();
    fetchRoles();
    fetchDisplayViews();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync custom selectedRoles with form role string
  useEffect(() => {
    form.setValue("role", selectedRoles.join(","), { shouldValidate: !!selectedRoles.length });
  }, [selectedRoles, form]);

  const fetchUsers = async () => {
    try {
      const res = await findAllusers();
      if (res.status === 200) setUsers(res.data || []);
    } catch (error) { console.error(error); }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await findAllWorkspaces();
      if (res.status === 200) setRawWorkspaces(res.data || []);
    } catch (error) { console.error(error); }
  };

  const fetchRoles = async () => {
    try {
      const res = await findAllRoles();
      if (res.status === 200) setRolesList(res.data || []);
    } catch (error) { console.error(error); }
  };
  
  const fetchDisplayViews = async () => {
    try {
      const res = await findAllDisplayViews();
      if (res.status === 200) setAllDisplayViews(res.data || []);
    } catch (error) { console.error(error); }
  };

  const handleEmailChange = (val: string, fieldChange: (val: string) => void) => {
    fieldChange(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val || val.trim().length < 1) {
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
    }, 200);
  };

  const handleSelectADUser = (adUser: any) => {
    form.setValue("email", adUser.email, { shouldValidate: true });
    form.setValue("name", adUser.name, { shouldValidate: true });
    setShowSuggestions(false);
    toast.success(`Loaded credentials for ${adUser.name}`);
  };

  // STEP 1: Add User Form submission -> Opens Step 2 Modal
  const onProceedToPermissions = (data: any) => {
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
      const isAdm = data.role.toLowerCase().includes("admin");
      const payload: any = {
        id: selectedUser?.id || undefined,
        name: data.name.trim(),
        email: data.email.trim(),
        role: data.role, // Comma separated string
        is_admin: isAdm,
        workspaceIds: isAdm ? [] : wsIds,
        reportIds: isAdm ? [] : rptIds,
        displayviewIds: isAdm ? [] : dvIds,
      };

      const res: any = await createUser(payload);
      if (res.status === 200 || res.status === 201) {
        toast.success(selectedUser ? "User updated successfully" : "User added successfully");
        fetchUsers();
        handleCancel();
        setIsAccessModalOpen(false);
      } else {
        toast.error("User save failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save user");
    }
  };

  const handleEditUser = (u: any) => {
    setSelectedUser(u);
    const rolesArray = (u.role || (u.is_admin ? "Admin" : "")).split(",").filter((r:string) => r.trim() !== "");
    setSelectedRoles(rolesArray);
    
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
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setSelectedRoles([]);
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

  // Checkbox handlers for the Modal Grid
  const handleToggleWorkspace = (wsId: number) => {
     if (selectedWorkspaceIds.includes(wsId)) {
        setSelectedWorkspaceIds(prev => prev.filter(id => id !== wsId));
        // Remove nested reports/views
        const ws = rawWorkspaces.find(w => w.id === wsId);
        const rptIds = (ws?.reports || []).map((r:any) => r.id);
        setSelectedReportIds(prev => prev.filter(id => !rptIds.includes(id)));
     } else {
        setSelectedWorkspaceIds(prev => [...prev, wsId]);
     }
  };
  
  const handleToggleReport = (rptId: number) => {
     if (selectedReportIds.includes(rptId)) {
        setSelectedReportIds(prev => prev.filter(id => id !== rptId));
     } else {
        setSelectedReportIds(prev => [...prev, rptId]);
     }
  };

  const handleToggleView = (dvId: number, isDefault: boolean, reportId: number) => {
     const relatedViews = allDisplayViews.filter(dv => dv.report?.id === reportId).map(dv => dv.id);
     
     if (isDefault) {
         if (selectedDisplayViewIds.includes(dvId)) {
             // Uncheck default
             setSelectedDisplayViewIds(prev => prev.filter(id => id !== dvId));
         } else {
             // Check default -> uncheck all specific views for this report
             setSelectedDisplayViewIds(prev => {
                 const filtered = prev.filter(id => !relatedViews.includes(id));
                 return [...filtered, dvId];
             });
         }
     } else {
         if (selectedDisplayViewIds.includes(dvId)) {
             setSelectedDisplayViewIds(prev => prev.filter(id => id !== dvId));
         } else {
             // Check specific view -> uncheck default view for this report
             setSelectedDisplayViewIds(prev => {
                 const filtered = prev.filter(id => id !== (0 - reportId));
                 return [...filtered, dvId];
             });
         }
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

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);

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
            
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem className="relative" ref={suggestionsRef}>
                <FormLabel className="text-[12px] font-bold text-[#0d2745] flex items-center justify-between">
                  <span>User Name</span>
                  {isSearchingAD && <span className="text-[11px] text-[#2f8fe0]"><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Searching AD</span>}
                </FormLabel>
                <FormControl>
                  <Input {...field} onChange={(e) => {
                     field.onChange(e);
                     handleEmailChange(e.target.value, () => {});
                  }} placeholder="Start typing to search AD users..." className="h-8 text-xs border-[#dce6f1] rounded-md shadow-2xs focus-visible:ring-[#2f8fe0]" />
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

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px] font-bold text-[#0d2745]">Email</FormLabel>
                <FormControl>
                  <Input {...field} readOnly placeholder="Will be populated from AD" className="h-8 text-xs bg-[#f6f9fc] border-[#dce6f1] rounded-md shadow-2xs" />
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
                             if(checked) setSelectedRoles(prev => [...prev, role.role]);
                             else setSelectedRoles(prev => prev.filter(r => r !== role.role));
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
               <input type="checkbox" id="isActive" defaultChecked className="rounded border-gray-300 text-[#2f8fe0] focus:ring-[#2f8fe0]" />
               <label htmlFor="isActive" className="text-[12px] font-bold text-[#0d2745]">Is Active</label>
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
          <div className="relative w-64">
            <Input value={tableSearch} onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }} placeholder="Search users..." className="h-8 text-xs border-[#dce6f1] pl-8" />
            <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <Table className="text-xs">
            <TableHeader className="bg-[#edf4fa]">
              <TableRow className="border-[#dce6f1]">
                <TableHead className="text-[10px] font-bold text-[#0a1c30]">FULL NAME</TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30]">EMAIL</TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30]">USER ROLES</TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30]">ASSIGNED WORKSPACES & REPORTS</TableHead>
                <TableHead className="text-center text-[10px] font-bold text-[#0a1c30]">ACTIONS</TableHead>
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
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleEditUser(u)} className="text-[#0e2947] hover:underline font-medium">Edit</button>
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:underline font-medium">Delete</button>
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
            <span className="text-[#5c7f9f]">Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}</span>
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
            <DialogTitle className="text-[15px] font-bold text-[#0a1c30]">User Access View</DialogTitle>
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
                            <TableHead className="font-bold text-[#0a1c30] w-[30%]">Sourcing Workspace</TableHead>
                            <TableHead className="font-bold text-[#0a1c30] w-[30%]">Report</TableHead>
                            <TableHead className="font-bold text-[#0a1c30] w-[40%]">Manage Permission (Views)</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {rawWorkspaces.map(ws => (
                            <React.Fragment key={ws.id}>
                               <TableRow className="bg-[#fcfdfef0] border-[#dce6f1] hover:bg-[#f6fafc]">
                                  <TableCell className="font-semibold text-[#0a1c30] align-top py-3">
                                     <div className="flex items-center gap-2">
                                        <input type="checkbox" checked={selectedWorkspaceIds.includes(ws.id)} onChange={() => handleToggleWorkspace(ws.id)} className="rounded border-gray-300 text-[#2f8fe0]" />
                                        {ws.name}
                                     </div>
                                  </TableCell>
                                  <TableCell colSpan={2} className="p-0 align-top">
                                     {(ws.reports || []).length === 0 ? (
                                        <div className="p-3 text-[#8aa6bf] italic">No reports</div>
                                     ) : (
                                        <div className="flex flex-col w-full h-full">
                                           {ws.reports.map((rpt:any, i:number) => {
                                              const rptViews = allDisplayViews.filter(dv => dv.report?.id === rpt.id);
                                              return (
                                                 <div key={rpt.id} className={`flex border-b border-[#edf3f9] last:border-0 ${i % 2 !== 0 ? 'bg-white' : 'bg-transparent'}`}>
                                                    <div className="w-[43%] p-3 border-r border-[#edf3f9]">
                                                       <div className="flex items-center gap-2">
                                                          <input type="checkbox" checked={selectedReportIds.includes(rpt.id)} onChange={() => handleToggleReport(rpt.id)} className="rounded border-gray-300 text-[#2f8fe0]" />
                                                          <span className="font-medium text-[#335375]">{rpt.report_name}</span>
                                                       </div>
                                                    </div>
                                                    <div className="w-[57%] p-3">
                                                       <div className="flex flex-col gap-2">
                                                          {/* Default View Checkbox */}
                                                          <label className="flex items-center gap-2 cursor-pointer group">
                                                             <input type="checkbox" checked={selectedDisplayViewIds.includes(0 - rpt.id)} onChange={() => handleToggleView(0 - rpt.id, true, rpt.id)} className="rounded border-gray-300 text-[#2f8fe0]" />
                                                             <span className="text-[11.5px] text-[#0a1c30] group-hover:text-[#2f8fe0] font-semibold">Default View (Full Dataset)</span>
                                                          </label>
                                                          
                                                          {/* Specific Views */}
                                                          {rptViews.length > 0 && (
                                                             <div className="ml-5 flex flex-col gap-1.5 border-l-2 border-[#edf3f9] pl-3 py-1">
                                                                {rptViews.map((dv:any) => (
                                                                   <label key={dv.id} className="flex items-center gap-2 cursor-pointer group">
                                                                      <input type="checkbox" checked={selectedDisplayViewIds.includes(dv.id)} onChange={() => handleToggleView(dv.id, false, rpt.id)} className="rounded border-gray-300 text-[#2f8fe0]" />
                                                                      <span className="text-[11px] text-[#5c7f9f] group-hover:text-[#0a1c30] transition-colors">{dv.displayview_name}</span>
                                                                   </label>
                                                                ))}
                                                             </div>
                                                          )}
                                                       </div>
                                                    </div>
                                                 </div>
                                              )
                                           })}
                                        </div>
                                     )}
                                  </TableCell>
                               </TableRow>
                            </React.Fragment>
                         ))}
                      </TableBody>
                   </Table>
                </div>
             )}
          </div>

          <DialogFooter className="p-4 border-t border-[#edf3f9] bg-[#f9fbff]">
            <Button variant="outline" onClick={() => setIsAccessModalOpen(false)} className="text-xs h-8">Cancel</Button>
            <Button onClick={() => submitUserToBackend(form.getValues(), selectedWorkspaceIds, selectedReportIds, selectedDisplayViewIds.filter(id => id > 0))} className="bg-[#0e2947] hover:bg-[#163e6b] text-white text-xs h-8 px-6 font-semibold">Finished</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserMaster;
