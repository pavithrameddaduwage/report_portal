"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createUser, deleteUser, findAllusers, findAllRoles } from "@/services/user-service";
import { findAllWorkspaces } from "@/services/workspace-services";
import { searchADUsers } from "@/services/authentication-service";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  X,
  Shield,
  Folder,
  FileText,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
} from "lucide-react";

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Full name is required"),
  role: z.string().default("User"),
});

const UserMaster = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rawWorkspaces, setRawWorkspaces] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([
    { id: 1, role: "Admin" },
    { id: 2, role: "User" },
  ]);

  // Selected Permissions: Workspaces & Specific Reports
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<number[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Record<number, boolean>>({});

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

  const form = useForm<any>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "User",
    },
  });

  const selectedRole = form.watch("role");
  const isAdminRole = selectedRole?.toLowerCase() === "admin";

  useEffect(() => {
    fetchUsers();
    fetchWorkspaces();
    fetchRoles();
  }, []);

  // Handle outside click for suggestions popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await findAllusers();
      if (res.status === 200) {
        setUsers(res.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await findAllWorkspaces();
      if (res.status === 200) {
        const wsData = res.data || [];
        setRawWorkspaces(wsData);
        const initialExpanded: Record<number, boolean> = {};
        wsData.forEach((w: any) => {
          initialExpanded[w.id] = true;
        });
        setExpandedWorkspaces(initialExpanded);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await findAllRoles();
      if (res.status === 200 && res.data && res.data.length > 0) {
        setRolesList(res.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  // Real-time Active Directory search as user types email
  const handleEmailChange = (val: string, fieldChange: (val: string) => void) => {
    fieldChange(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

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
      } catch (err) {
        console.error("AD search error:", err);
      } finally {
        setIsSearchingAD(false);
      }
    }, 200);
  };

  // Select AD user -> auto-fill name & email
  const handleSelectADUser = (adUser: any) => {
    form.setValue("email", adUser.email, { shouldValidate: true });
    form.setValue("name", adUser.name, { shouldValidate: true });
    setShowSuggestions(false);
    toast.success(`Loaded credentials for ${adUser.name}`);
  };

  // Toggle Workspace Selection (and all reports inside it)
  const toggleWorkspace = (wsId: number) => {
    const ws = rawWorkspaces.find((w) => w.id === wsId);
    const rptIds = (ws?.reports || []).map((r: any) => r.id);

    if (selectedWorkspaceIds.includes(wsId)) {
      // Uncheck workspace and its reports
      setSelectedWorkspaceIds((prev) => prev.filter((id) => id !== wsId));
      setSelectedReportIds((prev) => prev.filter((id) => !rptIds.includes(id)));
    } else {
      // Check workspace and its reports
      setSelectedWorkspaceIds((prev) => [...prev, wsId]);
      setSelectedReportIds((prev) => Array.from(new Set([...prev, ...rptIds])));
    }
  };

  // Toggle Specific Report Selection
  const toggleReport = (rptId: number, wsId: number) => {
    setSelectedReportIds((prev) => {
      const isSelected = prev.includes(rptId);
      const nextReports = isSelected ? prev.filter((id) => id !== rptId) : [...prev, rptId];

      // Check if all reports in this workspace are now selected
      const ws = rawWorkspaces.find((w) => w.id === wsId);
      const wsReportIds = (ws?.reports || []).map((r: any) => r.id);
      const allSelected = wsReportIds.length > 0 && wsReportIds.every((id: number) => nextReports.includes(id));

      if (allSelected) {
        setSelectedWorkspaceIds((wPrev) => Array.from(new Set([...wPrev, wsId])));
      } else {
        setSelectedWorkspaceIds((wPrev) => wPrev.filter((id) => id !== wsId));
      }

      return nextReports;
    });
  };

  const handleSelectAllAccess = () => {
    const allWsIds = rawWorkspaces.map((w) => w.id);
    const allRptIds = rawWorkspaces.flatMap((w) => (w.reports || []).map((r: any) => r.id));
    setSelectedWorkspaceIds(allWsIds);
    setSelectedReportIds(allRptIds);
  };

  const handleClearAllAccess = () => {
    setSelectedWorkspaceIds([]);
    setSelectedReportIds([]);
  };

  const toggleAccordion = (wsId: number) => {
    setExpandedWorkspaces((prev) => ({ ...prev, [wsId]: !prev[wsId] }));
  };

  const onSubmit = async (data: any) => {
    try {
      const isAdm = data.role?.toLowerCase() === "admin";
      const payload: any = {
        id: selectedUser?.id || undefined,
        name: data.name.trim(),
        email: data.email.trim(),
        role: data.role,
        is_admin: isAdm,
        workspaceIds: isAdm ? [] : selectedWorkspaceIds,
        reportIds: isAdm ? [] : selectedReportIds,
      };

      const res: any = await createUser(payload);
      if (res.status === 200 || res.status === 201) {
        toast.success(selectedUser ? "User updated successfully" : "User added successfully");
        fetchUsers();
        handleCancel();
      } else {
        toast.error("User save failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save user");
    }
  };

  const handleEditUser = (u: any) => {
    setSelectedUser(u);
    form.reset({
      email: u.email || "",
      name: u.name || "",
      role: u.role || (u.is_admin ? "Admin" : "User"),
    });

    const userWsIds = (u.workspaces || []).map((w: any) => w.id);
    const userRptIds = (u.reports || []).map((r: any) => r.id);

    setSelectedWorkspaceIds(userWsIds);
    setSelectedReportIds(userRptIds);
  };

  const handleCancel = () => {
    setSelectedUser(null);
    form.reset({
      email: "",
      name: "",
      role: "User",
    });
    setSelectedWorkspaceIds([]);
    setSelectedReportIds([]);
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
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  // Filtered and Paginated users
  const filteredUsers = users.filter((u: any) => {
    if (!tableSearch.trim()) return true;
    const query = tableSearch.toLowerCase().trim();
    const nameMatch = (u.name || "").toLowerCase().includes(query);
    const emailMatch = (u.email || "").toLowerCase().includes(query);
    const roleMatch = (u.role || (u.is_admin ? "Admin" : "User")).toLowerCase().includes(query);
    return nameMatch || emailMatch || roleMatch;
  });

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
      {/* Left Column: Form Card with Granular Workspace & Report Permissions */}
      <div className="lg:col-span-6 bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#edf3f9]">
          <div className="w-8 h-8 rounded-lg bg-[#eaf4fd] text-[#2f8fe0] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-[#0a1c30]">
              {selectedUser ? `Edit User: ${selectedUser.name}` : "Add New User"}
            </h2>
            <p className="text-[11px] text-[#5c7f9f]">
              Configure user details, assign system role, and set granular report access
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 1. EMAIL ADDRESS (With AD Autocomplete) */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="relative" ref={suggestionsRef}>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745] flex items-center justify-between">
                    <span>Email Address (Active Directory)</span>
                    {isSearchingAD && (
                      <span className="text-[11px] text-[#2f8fe0] flex items-center gap-1 font-normal">
                        <Loader2 className="w-3 h-3 animate-spin" /> Searching AD...
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        onChange={(e) => handleEmailChange(e.target.value, field.onChange)}
                        placeholder="Search Active Directory name or email..."
                        className="h-8 text-xs border-[#dce6f1] text-[#0f2b48] placeholder:text-[#8aa6bf] rounded-md shadow-2xs pr-8 focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                      />
                      {field.value && (
                        <UserCheck className="w-4 h-4 text-[#2f8fe0] absolute right-2.5 top-2 pointer-events-none" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />

                  {/* AD Search Suggestions Dropdown */}
                  {showSuggestions && adSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-[#dce6f1] rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      <div className="p-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5c7f9f] bg-[#f6f9fc] border-b border-[#edf3f9]">
                        Select Domain User
                      </div>
                      {adSuggestions.map((adUser: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectADUser(adUser)}
                          className="p-2 hover:bg-[#eaf4fd] cursor-pointer transition-colors border-b border-[#edf3f9] last:border-0 flex flex-col"
                        >
                          <div className="font-semibold text-xs text-[#0a1c30]">{adUser.name}</div>
                          <div className="text-[11px] text-[#5c7f9f]">{adUser.email}</div>
                          {adUser.department && (
                            <div className="text-[10px] text-[#2f8fe0]">{adUser.department}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* 2. USER FULL NAME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. John Doe"
                      className="h-8 text-xs border-[#dce6f1] text-[#0f2b48] placeholder:text-[#8aa6bf] rounded-md shadow-2xs focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* 3. DYNAMIC ROLE DROPDOWN */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">System Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-8 text-xs border-[#dce6f1] text-[#0f2b48] rounded-md shadow-2xs">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="text-xs border-[#dce6f1]">
                      {rolesList.map((r: any) => (
                        <SelectItem key={r.id || r.role} value={r.role}>
                          {r.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* 4. GRANULAR WORKSPACES & SPECIFIC REPORTS ASSIGNMENT */}
            <div className="pt-2 border-t border-[#edf3f9]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#2f8fe0]" />
                  <span className="text-[12px] font-bold text-[#0d2745]">
                    Assigned Workspaces & Reports
                  </span>
                </div>
                {!isAdminRole && rawWorkspaces.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllAccess}
                      className="text-[11px] text-[#2f8fe0] hover:underline font-medium cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-[#dce6f1]">|</span>
                    <button
                      type="button"
                      onClick={handleClearAllAccess}
                      className="text-[11px] text-[#5c7f9f] hover:text-red-500 hover:underline font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {isAdminRole ? (
                <div className="p-3.5 rounded-lg bg-[#eaf4fd] border border-[#c8dced] flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-[#1e5f99] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#1e5f99] leading-relaxed">
                    <strong>Administrator Role:</strong> Users with the Admin role automatically have full unrestricted access to all workspaces, reports, and administrative management features.
                  </p>
                </div>
              ) : rawWorkspaces.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#5c7f9f] bg-[#f6f9fc] rounded-lg border border-[#dce6f1]">
                  No workspaces configured yet. Create a workspace in the Admin panel first.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {rawWorkspaces.map((ws: any) => {
                    const wsSelected = selectedWorkspaceIds.includes(ws.id);
                    const reports = ws.reports || [];
                    const selectedInWs = reports.filter((r: any) => selectedReportIds.includes(r.id)).length;
                    const isExpanded = expandedWorkspaces[ws.id] !== false;

                    return (
                      <div
                        key={ws.id}
                        className={`rounded-lg border transition-all ${
                          wsSelected
                            ? "bg-[#eaf4fd]/40 border-[#a8d3f7]"
                            : selectedInWs > 0
                            ? "bg-[#fbfdff] border-[#b8d9f5]"
                            : "bg-[#fbfdff] border-[#e2edf6]"
                        }`}
                      >
                        {/* Workspace Level Header Checkbox */}
                        <div className="p-2.5 flex items-center justify-between gap-2 border-b border-[#edf3f9]/60">
                          <div
                            onClick={() => toggleWorkspace(ws.id)}
                            className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                                wsSelected
                                  ? "bg-[#2f8fe0] text-white"
                                  : "border border-[#b8d2e8] bg-white"
                              }`}
                            >
                              {wsSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <Folder className="w-3.5 h-3.5 text-[#2f8fe0] shrink-0" />
                            <span className="text-xs font-semibold text-[#0a1c30] truncate">
                              {ws.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6fc] text-[#1e5f99] border border-[#dce6f1]">
                              {selectedInWs} of {reports.length} reports
                            </span>
                            {reports.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleAccordion(ws.id)}
                                className="text-[#8aa6bf] hover:text-[#0a1c30] p-1 rounded transition-colors"
                              >
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Individual Specific Reports Checklist */}
                        {isExpanded && reports.length > 0 && (
                          <div className="p-2.5 pt-1.5 bg-white/70 rounded-b-lg space-y-1 pl-6">
                            <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                              Specific Reports:
                            </span>
                            {reports.map((rpt: any) => {
                              const rptSelected = selectedReportIds.includes(rpt.id);

                              return (
                                <div
                                  key={rpt.id}
                                  onClick={() => toggleReport(rpt.id, ws.id)}
                                  className={`flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-colors select-none ${
                                    rptSelected
                                      ? "bg-[#eaf4fd] text-[#0f2b48]"
                                      : "hover:bg-[#f6f9fc] text-[#335375]"
                                  }`}
                                >
                                  <div
                                    className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors ${
                                      rptSelected
                                        ? "bg-[#2f8fe0] text-white"
                                        : "border border-[#b8d2e8] bg-white"
                                    }`}
                                  >
                                    {rptSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                  <FileText className="w-3 h-3 text-[#2f8fe0] shrink-0" />
                                  <span className="text-[11.5px] font-medium truncate">
                                    {rpt.report_name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#edf3f9]">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="h-8 text-xs px-4 rounded-md border-[#dce6f1] text-[#335375] hover:bg-[#f6fafc] font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8 text-xs px-5 rounded-md bg-[#0e2947] hover:bg-[#163e6b] text-white font-semibold shadow-2xs cursor-pointer"
              >
                {selectedUser ? "Update User" : "Add User"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right Column: Existing Users (Expanded width + 6-item pagination) */}
      <div className="lg:col-span-6 bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs">
        {/* Card Header with Search & Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#edf3f9]">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-bold text-[#0a1c30]">Existing users</h2>
            <span className="text-[11px] bg-[#f0f6fc] text-[#1e5f99] font-bold px-2 py-0.5 rounded-full border border-[#dce6f1]">
              {filteredUsers.length}
            </span>
          </div>

          {/* Search Filter Input with Clear Button */}
          <div className="relative w-full sm:w-64">
            <Input
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search users by name, email, role..."
              className="h-8 text-xs border-[#dce6f1] text-[#0f2b48] placeholder:text-[#8aa6bf] rounded-md shadow-2xs pl-8 pr-7"
            />
            <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-2.5 pointer-events-none" />
            {tableSearch && (
              <button
                type="button"
                onClick={() => {
                  setTableSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-2 text-[#8aa6bf] hover:text-[#0a1c30] p-0.5 rounded cursor-pointer transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto w-full">
          <Table className="text-xs min-w-[380px]">
            <TableHeader className="bg-[#edf4fa]">
              <TableRow className="border-[#dce6f1]">
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                  NAME & EMAIL
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                  ROLE & ACCESS
                </TableHead>
                <TableHead className="text-center text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                  ACTION
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-[#5c7f9f]">
                    {tableSearch ? (
                      <div className="flex flex-col items-center gap-2">
                        <span>No users matching &quot;{tableSearch}&quot;</span>
                        <button
                          type="button"
                          onClick={() => {
                            setTableSearch("");
                            setCurrentPage(1);
                          }}
                          className="text-xs text-[#2f8fe0] hover:underline font-semibold cursor-pointer"
                        >
                          Clear search filter
                        </button>
                      </div>
                    ) : (
                      "No users configured"
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((u: any) => {
                  const isAdm = u.role?.toLowerCase() === "admin" || u.is_admin;
                  const wsCount = (u.workspaces || []).length;
                  const rptCount = (u.reports || []).length;

                  return (
                    <TableRow key={u.id} className="border-[#dce6f1] hover:bg-[#f6fafc] transition-colors">
                      <TableCell className="py-2.5">
                        <div className="font-semibold text-[#0f2b48]">{u.name}</div>
                        <div className="text-[11px] text-[#5c7f9f] truncate">{u.email}</div>
                      </TableCell>
                      <TableCell className="text-xs py-2.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                              isAdm
                                ? "bg-[#eaf4fd] text-[#1e5f99] border border-[#c8dced]"
                                : "bg-[#f0f6fc] text-[#335375] border border-[#dce6f1]"
                            }`}
                          >
                            {u.role || (isAdm ? "Admin" : "User")}
                          </span>
                          <span className="text-[10.5px] text-[#5c7f9f]">
                            {isAdm
                              ? "All Reports (Superadmin)"
                              : wsCount > 0
                              ? `${wsCount} ws, ${rptCount} reports`
                              : rptCount > 0
                              ? `${rptCount} specific reports`
                              : "No access assigned"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2.5 whitespace-nowrap">
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => handleEditUser(u)}
                            className="border border-[#dce6f1] rounded px-2.5 py-1 text-[11px] text-[#0e2947] hover:bg-[#f0f6fc] font-medium transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="border border-red-200 text-red-500 hover:bg-red-50 rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Delete
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

        {/* Pagination & Count Controls */}
        {filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-[#edf3f9]">
            <div className="text-[11px] text-[#5c7f9f]">
              Showing <span className="font-semibold text-[#0f2b48]">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-[#0f2b48]">
                {Math.min(startIndex + PAGE_SIZE, filteredUsers.length)}
              </span>{" "}
              of <span className="font-semibold text-[#0f2b48]">{filteredUsers.length}</span>{" "}
              {filteredUsers.length === 1 ? "user" : "users"}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="h-7 px-2 text-xs border-[#dce6f1] text-[#0f2b48] hover:bg-[#f0f6fc] disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Prev
                </Button>

                {/* Page Number Pills */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= safeCurrentPage - 1 && page <= safeCurrentPage + 1)
                      );
                    })
                    .map((page, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && page - prev > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-1 text-[11px] text-[#8aa6bf]">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`h-7 min-w-[28px] px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                              safeCurrentPage === page
                                ? "bg-[#0e2947] text-white"
                                : "bg-[#f6f9fc] text-[#335375] hover:bg-[#eaf4fd] border border-[#dce6f1]"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="h-7 px-2 text-xs border-[#dce6f1] text-[#0f2b48] hover:bg-[#f0f6fc] disabled:opacity-40"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMaster;
