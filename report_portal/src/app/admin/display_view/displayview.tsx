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
import { getItemsforDropdown } from "@/services/datawarehouse-service";
import {
  createDisplayView,
  findAllDisplayViews,
  findReportsByWorkspaceId,
} from "@/services/report-service";
import { findAllWorkspaces } from "@/services/workspace-services";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type Report_View = {
  id?: number;
  workspace_id: number;
  report_id: number;
  displayview_name: string;
};

const displayViewSchema = z.object({
  workspace_id: z.number().min(1, "Workspace is required"),
  report_id: z.number().min(1, "Report is required"),
  displayview_name: z.string().min(2, "Display view name is required"),
});

const DisplayView = () => {
  const [selectedReportView, setSelectedReportView] = useState<any>({});
  const [workspaces, setWorkspaces] = useState<any>([]);
  const [reports, setReports] = useState<any>([]);
  const [selectedReport, setSelectedReport] = useState<any>();
  const [selectedFilters, setSelectedFilters] = useState<any>([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [selectedFunction, setSelectedFunction] = useState("no filter");
  const [selectedParameter, setSelectedParameter] = useState("");
  const [displayViews, setDisplayViews] = useState<any>([]);

  const form = useForm<z.infer<typeof displayViewSchema>>({
    resolver: zodResolver(displayViewSchema),
    defaultValues: {
      workspace_id: 0,
      report_id: 0,
      displayview_name: "",
    },
  });

  useEffect(() => {
    fetchWorkspaces();
    fetchAllDisplayViews();
  }, []);

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

  const fetchReports = async (workspaceId: number) => {
    try {
      const res = await findReportsByWorkspaceId(workspaceId);
      if (res.status === 200) {
        setReports(
          res.data.map((rpt: any) => ({
            value: rpt.id,
            label: rpt.report_name,
            columns: rpt.columns,
            report_view: rpt.report_view,
            database_schema: rpt.database_schema,
          }))
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllDisplayViews = async () => {
    try {
      const response = await findAllDisplayViews();
      if (response.status === 200) {
        setDisplayViews(response.data);
      }
    } catch (error) {}
  };

  const onSubmit = async (data: Report_View) => {
    try {
      const response = await createDisplayView({
        ...data,
        filters: selectedFilters,
        id: selectedReportView?.id,
      });
      if (response.status === 201) {
        toast.success(selectedReportView?.id ? "Display view updated" : "Display view created");
        fetchAllDisplayViews();
        handleCancel();
      } else {
        toast.error("Save failed. Please check the inputs and try again.");
      }
    } catch (error: any) {
      toast.error("Save failed: " + error.message);
    }
  };

  const handleCancel = () => {
    form.reset({
      workspace_id: 0,
      report_id: 0,
      displayview_name: "",
    });
    setSelectedReportView({});
    setSelectedFilters([]);
    setSelectedColumn("");
    setSelectedFunction("no filter");
    setSelectedParameter("");
  };

  const handleAddFilter = (e: any) => {
    e.preventDefault();
    if (!selectedColumn) return;

    const existingIndex = selectedFilters.findIndex((f: any) => f.column === selectedColumn);
    const newFilter = {
      column: selectedColumn,
      function: selectedFunction,
      parameter: selectedParameter || "—",
    };

    if (existingIndex >= 0) {
      const updated = [...selectedFilters];
      updated[existingIndex] = newFilter;
      setSelectedFilters(updated);
    } else {
      setSelectedFilters([...selectedFilters, newFilter]);
    }

    setSelectedColumn("");
    setSelectedFunction("no filter");
    setSelectedParameter("");
  };

  const handleRemoveFilter = (column: string) => {
    setSelectedFilters((prev: any) => prev.filter((f: any) => f.column !== column));
  };

  const handleEdit = (displayview: any) => {
    setSelectedReportView(displayview);
    setSelectedReport(displayview.report);
    form.setValue("workspace_id", displayview.report?.workspace?.id);
    fetchReports(displayview.report?.workspace?.id);
    form.setValue("report_id", displayview.report?.id);
    form.setValue("displayview_name", displayview.displayview_name);
    setSelectedFilters(displayview.displayview_columns || []);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
      {/* Left Column: Form */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-[#c8dced] p-5 shadow-2xs">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayview_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">Display View Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Default View" className="h-8 text-xs border-[#c8dced] text-[#0d2745] rounded-md shadow-none focus-visible:ring-1 focus-visible:ring-[#2f8fe0]" />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workspace_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">Workspace</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(val) => {
                      const num = Number(val);
                      field.onChange(num);
                      fetchReports(num);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-xs border-[#c8dced] text-[#0d2745] rounded-md">
                        <SelectValue placeholder="Select workspace" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="text-xs border-[#c8dced]">
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

            <FormField
              control={form.control}
              name="report_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">Report</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(val) => {
                      const num = Number(val);
                      field.onChange(num);
                      const rpt = reports.find((r: any) => r.value === num);
                      setSelectedReport(rpt);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-xs border-[#c8dced] text-[#0d2745] rounded-md">
                        <SelectValue placeholder="Select report" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="text-xs border-[#c8dced]">
                      {reports.map((rpt: any) => (
                        <SelectItem key={rpt.value} value={String(rpt.value)}>
                          {rpt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Filter Builder */}
            <div className="pt-2">
              <span className="text-[12px] font-bold text-[#0d2745] block mb-2">Add a column filter</span>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                  <SelectTrigger className="h-8 text-xs border-[#c8dced] text-[#0d2745] rounded-md w-36">
                    <SelectValue placeholder="Column" />
                  </SelectTrigger>
                  <SelectContent className="text-xs border-[#c8dced]">
                    {(selectedReport?.columns || []).map((col: any) => (
                      <SelectItem key={col.column} value={col.column}>
                        {col.column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                  <SelectTrigger className="h-8 text-xs border-[#c8dced] text-[#0d2745] rounded-md w-44">
                    <SelectValue placeholder="Select filter type" />
                  </SelectTrigger>
                  <SelectContent className="text-xs border-[#c8dced]">
                    <SelectItem value="no filter">No filter</SelectItem>
                    <SelectItem value="less_than">Less than</SelectItem>
                    <SelectItem value="less_than_or_equal">less than or equal</SelectItem>
                    <SelectItem value="greater_than">greater than</SelectItem>
                    <SelectItem value="greater_than_or_equal">greater than or equal</SelectItem>
                    <SelectItem value="between">between</SelectItem>
                    <SelectItem value="dropdown">Distinct items</SelectItem>
                    <SelectItem value="hide">Hide</SelectItem>
                    <SelectItem value="notnull">Not Null / Not Empty</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  value={selectedParameter}
                  onChange={(e) => setSelectedParameter(e.target.value)}
                  placeholder="Parameter"
                  className="h-8 text-xs border-[#c8dced] text-[#0d2745] rounded-md w-36 shadow-none"
                />

                <Button
                  type="button"
                  onClick={handleAddFilter}
                  disabled={!selectedColumn}
                  className="h-8 text-xs px-4 bg-[#0e2947] hover:bg-[#163e6b] text-white font-medium rounded-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>

              {/* Filters Table */}
              <div className="border border-[#c8dced] rounded-lg overflow-x-auto mt-3">
                <Table className="text-xs min-w-[380px]">
                  <TableHeader className="bg-[#dbe9f6]">
                    <TableRow className="border-[#c8dced]">
                      <TableHead className="text-[11px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">COLUMN NAME</TableHead>
                      <TableHead className="text-[11px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">FILTER TYPE</TableHead>
                      <TableHead className="text-[11px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">PARAMETER</TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFilters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-5 text-[#4a759f]">
                          No filters configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedFilters.map((filter: any) => (
                        <TableRow key={filter.column} className="border-[#c8dced] hover:bg-[#eaf4fd]">
                          <TableCell className="font-medium text-[#0d2745] whitespace-nowrap">{filter.column}</TableCell>
                          <TableCell className="text-[#2b5278] whitespace-nowrap">{filter.function}</TableCell>
                          <TableCell className="text-[#2b5278] whitespace-nowrap">{filter.parameter}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoveFilter(filter.column)}
                              className="border border-[#c8dced] rounded p-1 text-red-500 hover:bg-red-50"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

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
                className="h-8 text-xs px-5 rounded-md bg-[#1890ff] hover:bg-[#096dd9] text-white font-semibold shadow-2xs"
              >
                {selectedReportView?.id ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right Column: Existing Display Views */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-[#c8dced] p-5 shadow-2xs">
        <h2 className="text-[13px] font-bold text-[#0a1c30] mb-3">Existing display views</h2>
        <div className="overflow-x-auto w-full">
          <Table className="text-xs min-w-[340px]">
            <TableHeader className="bg-[#dbe9f6]">
              <TableRow className="border-[#c8dced]">
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">REPORT NAME</TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">DISPLAY VIEW</TableHead>
                <TableHead className="text-center text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayViews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-[#4a759f]">
                    No display views configured
                  </TableCell>
                </TableRow>
              ) : (
                displayViews.map((view: any) => (
                  <TableRow key={view.id} className="border-[#c8dced] hover:bg-[#eaf4fd] transition-colors">
                    <TableCell className="font-medium text-[#0d2745] whitespace-nowrap">{view.report?.report_name}</TableCell>
                    <TableCell className="text-[#2b5278] whitespace-nowrap">{view.displayview_name}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => handleEdit(view)}
                          className="border border-[#c8dced] rounded px-2.5 py-0.5 text-[11px] text-[#0e2947] hover:bg-[#eaf4fd] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteDisplayView(view.id);
                            fetchAllDisplayViews();
                          }}
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

export default DisplayView;
