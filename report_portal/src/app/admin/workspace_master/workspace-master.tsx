"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import {
  createWorkspace,
  deleteWorkspace,
  findAllWorkspaces,
} from "@/services/workspace-services";
import { toast } from "sonner";

type Workspace = {
  id?: number;
  name: string;
  description: string;
};

const workspaceSchema = z.object({
  name: z.string().min(2, "Workspace name is required"),
  description: z.string().min(2, "Description is required"),
});

const WorkspaceMaster = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  const form = useForm<Workspace>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "", description: "" },
  });

  const fetchWorkspaces = async () => {
    try {
      const res = await findAllWorkspaces();
      if (res.status === 200) {
        setWorkspaces(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleEditWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    form.reset(workspace);
  };

  const handleDeleteWorkspace = async (id: number) => {
    try {
      const res = await deleteWorkspace(id);
      if (res.status === 200 || res.status === 201) {
        fetchWorkspaces();
        toast.success("Workspace deleted");
      }
    } catch (error) {
      toast.error("Failed to delete workspace");
    }
  };

  const onSubmit = async (data: Workspace) => {
    try {
      if (selectedWorkspace) data.id = selectedWorkspace.id;
      const res = await createWorkspace(data);

      if (res.status === 201) {
        fetchWorkspaces();
        handleCancel();
        toast.success(selectedWorkspace?.id ? "Workspace updated" : "Workspace created");
      }
    } catch (error) {
      toast.error("Failed to save workspace");
    }
  };

  const handleCancel = () => {
    setSelectedWorkspace(null);
    form.reset({ name: "", description: "" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
      {/* Left Column: Form (Narrower) */}
      <div className="lg:col-span-4 bg-white rounded-xl border border-[#c8dced] p-5 shadow-2xs">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">Workspace name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Demo Workspace" className="h-8 text-xs border-[#c8dced] text-[#0d2745] rounded-md shadow-none focus-visible:ring-1 focus-visible:ring-[#2f8fe0]" />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Brief description..."
                      className="min-h-[80px] border-[#c8dced] text-[#0d2745] text-xs rounded-md shadow-none focus-visible:ring-1 focus-visible:ring-[#2f8fe0] resize-none"
                    />
                  </FormControl>
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
                className="h-8 text-xs px-4 rounded-md border-[#c8dced] text-[#2b5278] hover:bg-[#eaf4fd] font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8 text-xs px-5 rounded-md bg-[#1890ff] hover:bg-[#096dd9] text-white font-semibold shadow-2xs cursor-pointer"
              >
                {selectedWorkspace?.id ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right Column: Existing Workspaces (Wider) */}
      <div className="lg:col-span-8 bg-white rounded-xl border border-[#c8dced] p-5 shadow-2xs">
        <h2 className="text-[13px] font-bold text-[#0a1c30] mb-3">Existing workspaces</h2>
        <div className="overflow-x-auto w-full">
          <Table className="text-xs min-w-[340px]">
            <TableHeader className="bg-[#dbe9f6]">
              <TableRow className="border-[#c8dced]">
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">WORKSPACE</TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">DESCRIPTION</TableHead>
                <TableHead className="text-center text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-[#4a759f]">
                    No workspaces configured
                  </TableCell>
                </TableRow>
              ) : (
                workspaces.map((workspace) => (
                  <TableRow key={workspace.id} className="border-[#c8dced] hover:bg-[#eaf4fd] transition-colors">
                    <TableCell className="font-medium text-[#0d2745] whitespace-nowrap">{workspace.name}</TableCell>
                    <TableCell className="text-[#2b5278] truncate max-w-[150px]">{workspace.description}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => handleEditWorkspace(workspace)}
                          className="border border-[#c8dced] rounded px-2.5 py-0.5 text-[11px] text-[#0e2947] hover:bg-[#eaf4fd] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkspace(workspace.id!)}
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

export default WorkspaceMaster;
