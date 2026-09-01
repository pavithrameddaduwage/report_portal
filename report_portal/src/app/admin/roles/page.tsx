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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createRole, deleteRole, findAllRoles } from "@/services/user-service";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Key,
  Shield,
  FileText,
  Monitor,
  Home,
  Users,
  Clock,
  Download,
  Filter,
  Check,
  CheckSquare,
  Square,
} from "lucide-react";

const AVAILABLE_PERMISSIONS = [
  {
    id: "report_config",
    label: "Report Configuration",
    description: "Create, edit, and configure data reports and data sources",
    icon: FileText,
  },
  {
    id: "display_view",
    label: "Display View Configuration",
    description: "Design and customize column display views",
    icon: Monitor,
  },
  {
    id: "workspace_management",
    label: "Workspace Management",
    description: "Create workspaces and manage report assignments",
    icon: Home,
  },
  {
    id: "user_management",
    label: "User Management",
    description: "Add, edit users, and configure workspace permissions",
    icon: Users,
  },
  {
    id: "report_scheduler",
    label: "Report Scheduler & Automation",
    description: "Create, configure, execute, and monitor automated report email dispatches",
    icon: Clock,
  },
  {
    id: "roles_permissions",
    label: "Roles & Permissions",
    description: "Create custom roles and manage assigned privileges",
    icon: Key,
  },
  {
    id: "csv_export",
    label: "CSV Data Export",
    description: "Export and download report data in CSV format",
    icon: Download,
  },
  {
    id: "filter_sort",
    label: "Advanced Filtering & Sorting",
    description: "Use interactive column filters, date/number ranges, and sorting",
    icon: Filter,
  },
];

const roleSchema = z.object({
  role: z.string().min(2, "Role name must be at least 2 characters"),
});

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "csv_export",
    "filter_sort",
  ]);

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: "",
    },
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await findAllRoles();
      if (res.status === 200) {
        setRoles(res.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(AVAILABLE_PERMISSIONS.map((p) => p.id));
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  const onSubmit = async (data: z.infer<typeof roleSchema>) => {
    try {
      const payload = {
        id: selectedRole?.id || undefined,
        role: data.role.trim(),
        permissions: selectedPermissions,
      };

      const res: any = await createRole(payload);
      if (res.status === 200 || res.status === 201) {
        toast.success(selectedRole ? "Role updated" : "Role created successfully");
        fetchRoles();
        handleCancel();
      } else {
        toast.error("Failed to save role");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to save role");
    }
  };

  const handleEditRole = (r: any) => {
    setSelectedRole(r);
    form.reset({
      role: r.role || "",
    });
    setSelectedPermissions(Array.isArray(r.permissions) ? r.permissions : []);
  };

  const handleCancel = () => {
    setSelectedRole(null);
    form.reset({
      role: "",
    });
    setSelectedPermissions(["csv_export", "filter_sort"]);
  };

  const handleDeleteRole = async (id: number, roleName: string) => {
    try {
      const res = await deleteRole(id);
      if (res.status === 200 || res.status === 201 || res.data?.success) {
        toast.success(`Role '${roleName}' deleted successfully`);
        if (selectedRole?.id === id) {
          handleCancel();
        }
        fetchRoles();
      } else {
        toast.error("Failed to delete role");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete role");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
      {/* Left Column: Role Form Card */}
      <div className="lg:col-span-6 bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#edf3f9]">
          <div className="w-8 h-8 rounded-lg bg-[#eaf4fd] text-[#2f8fe0] flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-[#0a1c30]">
              {selectedRole ? `Edit Role: ${selectedRole.role}` : "Create New Role"}
            </h2>
            <p className="text-[11px] text-[#5c7f9f]">
              Configure role name and tick the privileges assigned to this role
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">
                    Role Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Data Analyst, Viewer, Finance Auditor"
                      className="h-8 text-xs border-[#dce6f1] text-[#0f2b48] placeholder:text-[#8aa6bf] rounded-md shadow-2xs focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Interactive Privileges Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#0d2745]">
                  Assign Privileges ({selectedPermissions.length} selected)
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] text-[#2f8fe0] hover:underline font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-[#dce6f1]">|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] text-[#5c7f9f] hover:text-[#d33a3a] hover:underline font-medium cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm.id);
                  const Icon = perm.icon;

                  return (
                    <div
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isChecked
                          ? "bg-[#eaf4fd]/60 border-[#a8d3f7] shadow-2xs"
                          : "bg-[#fbfdff] border-[#e2edf6] hover:bg-[#f6fafc]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? "bg-[#2f8fe0] text-white"
                            : "border border-[#b8d2e8] bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isChecked ? "text-[#2f8fe0]" : "text-[#8aa6bf]"}`} />
                          <span className={`text-xs font-semibold truncate ${isChecked ? "text-[#0f2b48]" : "text-[#335375]"}`}>
                            {perm.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                {selectedRole ? "Update Role" : "Save Role"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right Column: Existing Roles */}
      <div className="lg:col-span-6 bg-white rounded-xl border border-[#dce6f1] p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-[#0a1c30]">Existing Roles</h2>
          <span className="text-[11px] bg-[#f0f6fc] text-[#1e5f99] font-bold px-2 py-0.5 rounded-full">
            {roles.length} {roles.length === 1 ? "role" : "roles"}
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <Table className="text-xs min-w-[340px]">
            <TableHeader className="bg-[#edf4fa]">
              <TableRow className="border-[#dce6f1]">
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                  ROLE
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                  PRIVILEGES
                </TableHead>
                <TableHead className="text-center text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                  ACTION
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-[#5c7f9f]">
                    No roles configured
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((r: any) => {
                  const isSystem = r.role.toLowerCase() === "admin" || r.role.toLowerCase() === "user";
                  const permsCount = Array.isArray(r.permissions) ? r.permissions.length : 0;

                  return (
                    <TableRow key={r.id} className="border-[#dce6f1] hover:bg-[#f6fafc] transition-colors">
                      <TableCell className="font-semibold text-[#0f2b48] whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          r.role.toLowerCase() === "admin"
                            ? "bg-[#eaf4fd] text-[#1e5f99] border border-[#c8dced]"
                            : "bg-[#f0f6fc] text-[#335375] border border-[#dce6f1]"
                        }`}>
                          <Shield className="w-3 h-3" />
                          <span>{r.role}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-[11px] text-[#5c7f9f] max-w-[300px]">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(r.permissions) && r.permissions.length > 0 ? (
                            r.permissions.map((permId: string) => {
                              const permInfo = AVAILABLE_PERMISSIONS.find((p) => p.id === permId);
                              return (
                                <span key={permId} className="bg-[#f6f9fc] text-[#2b5278] border border-[#dce6f1] px-1.5 py-0.5 text-[10px] rounded font-medium truncate max-w-[150px]">
                                  {permInfo ? permInfo.label : permId}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-gray-400 italic text-[10px]">No privileges</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => handleEditRole(r)}
                            className="border border-[#dce6f1] rounded px-2.5 py-0.5 text-[11px] text-[#0e2947] hover:bg-[#f0f6fc] font-medium transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(r.id, r.role)}
                            className="border border-red-200 text-red-500 hover:bg-red-50 rounded px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer"
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
      </div>
    </div>
  );
}
