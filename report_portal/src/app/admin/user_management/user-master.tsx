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
import { Loader2, Search, UserCheck } from "lucide-react";

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Full name is required"),
  role: z.string().default("User"),
  workspaceId: z.number().optional(),
});

const UserMaster = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([
    { id: 1, role: "Admin" },
    { id: 2, role: "User" },
  ]);

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
      workspaceId: undefined,
    },
  });

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
        setWorkspaces(res.data.map((ws: any) => ({ value: ws.id, label: ws.name })));
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

  const onSubmit = async (data: any) => {
    try {
      const payload: any = {
        id: selectedUser?.id || undefined,
        name: data.name,
        email: data.email,
        role: data.role,
        is_admin: data.role === "Admin",
        workspaceIds: data.workspaceId ? [data.workspaceId] : [],
      };

      const res: any = await createUser(payload);
      if (res.status === 200 || res.status === 201) {
        toast.success(selectedUser ? "User updated" : "User added successfully");
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
      workspaceId: u.workspaces && u.workspaces.length > 0 ? u.workspaces[0].id : undefined,
    });
  };

  const handleCancel = () => {
    setSelectedUser(null);
    form.reset({
      email: "",
      name: "",
      role: "User",
      workspaceId: undefined,
    });
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
      {/* Left Column: Form Card */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 1. EMAIL ADDRESS (Top Field with AD Autocomplete) */}
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
                        onFocus={() => {
                          if (adSuggestions.length > 0) setShowSuggestions(true);
                        }}
                        placeholder="Type letters to search AD (e.g. john@horizongroupusa.com)"
                        className="h-8 text-xs border-[#dce6f1] text-[#0f2b48] placeholder:text-[#8aa6bf] rounded-md shadow-2xs focus-visible:ring-1 focus-visible:ring-[#2f8fe0] pr-8"
                      />
                      <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </FormControl>

                  {/* AD Autocomplete Suggestions Dropdown */}
                  {showSuggestions && adSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#dce6f1] rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto divide-y divide-[#edf3f9]">
                      <div className="px-3 py-1.5 bg-[#f6f9fc] text-[10px] font-bold text-[#5c7f9f] uppercase tracking-wider">
                        Active Directory Matches ({adSuggestions.length})
                      </div>
                      {adSuggestions.map((adUser: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectADUser(adUser)}
                          className="px-3 py-2 hover:bg-[#eaf4fd] cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div>
                            <div className="font-semibold text-xs text-[#0f2b48] group-hover:text-[#2f8fe0] flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-[#2f8fe0]" />
                              <span>{adUser.name}</span>
                            </div>
                            <div className="text-[11px] text-[#5c7f9f]">{adUser.email}</div>
                          </div>
                          {adUser.department && (
                            <span className="text-[10px] bg-[#f0f6fc] text-[#1e5f99] font-medium px-2 py-0.5 rounded">
                              {adUser.department}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* 2. FULL NAME (Auto-filled from AD) */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Full Name (auto-fills on email selection)"
                      className="h-8 text-xs border-[#dce6f1] text-[#0f2b48] placeholder:text-[#8aa6bf] rounded-md shadow-2xs focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* 3. DYNAMIC ROLE DROPDOWN FROM ROLES MASTER */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">Role</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
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

            {/* 4. WORKSPACE ACCESS */}
            <FormField
              control={form.control}
              name="workspaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">Workspace access</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-xs border-[#dce6f1] text-[#0f2b48] rounded-md shadow-2xs">
                        <SelectValue placeholder="Select workspace" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="text-xs border-[#dce6f1]">
                      {workspaces.map((ws: any) => (
                        <SelectItem key={ws.value} value={String(ws.value)}>
                          {ws.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
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

      {/* Right Column: Existing Users */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs">
        <h2 className="text-[13px] font-bold text-[#0a1c30] mb-3">Existing users</h2>
        <div className="overflow-x-auto w-full">
          <Table className="text-xs min-w-[340px]">
            <TableHeader className="bg-[#edf4fa]">
              <TableRow className="border-[#dce6f1]">
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">NAME</TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">ROLE</TableHead>
                <TableHead className="text-center text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-[#5c7f9f]">
                    No users configured
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u: any) => (
                  <TableRow key={u.id} className="border-[#dce6f1] hover:bg-[#f6fafc] transition-colors">
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium text-[#0f2b48]">{u.name}</div>
                      <div className="text-[11px] text-[#5c7f9f] truncate max-w-[150px]">{u.email}</div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === "Admin" || u.is_admin
                          ? "bg-[#eaf4fd] text-[#1e5f99] border border-[#c8dced]"
                          : "bg-[#f0f6fc] text-[#335375] border border-[#dce6f1]"
                      }`}>
                        {u.role || (u.is_admin ? "Admin" : "User")}
                      </span>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => handleEditUser(u)}
                          className="border border-[#dce6f1] rounded px-2.5 py-0.5 text-[11px] text-[#0e2947] hover:bg-[#f0f6fc] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          className="border border-red-200 text-red-500 hover:bg-red-50 rounded px-2.5 py-0.5 text-[11px] font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default UserMaster;
