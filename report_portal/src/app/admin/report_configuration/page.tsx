"use client";

import React, { useEffect, useState } from "react";
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
import { GripVertical, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { findAllWorkspaces } from "@/services/workspace-services";
import {
  createReport,
  deleteReport,
  findAllReports,
} from "@/services/report-service";
import { getColumnListBySchemaAndView } from "@/services/datawarehouse-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Sortable Column Row Component ---
function SortableColumnRow({
  col,
  index,
  handleColumnChange,
  handleSelectFilterType,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.column });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    borderTop: isDragging ? "2px solid #2f8fe0" : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`border-[#c8dced] ${isDragging ? "bg-[#eaf4fd]" : "hover:bg-[#eaf4fd]/40"}`}
    >
      <TableCell className="w-[40px] px-2 text-center">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[#4a759f] hover:text-[#0a1c30] flex items-center justify-center"
        >
          <GripVertical size={16} />
        </div>
      </TableCell>
      <TableCell className="w-[50px] text-center">
        <div className="w-6 h-6 rounded bg-[#eaf4fd] text-[#2f8fe0] font-bold text-xs flex items-center justify-center mx-auto select-none">
          {index + 1}
        </div>
      </TableCell>
      <TableCell className="text-center w-[50px]">
        <input
          type="checkbox"
          name="hidden"
          checked={col.hidden || false}
          onChange={(e) => handleColumnChange(col, e)}
          className="h-4 w-4 rounded border-[#c8dced] text-[#1890ff] focus:ring-0 cursor-pointer"
        />
      </TableCell>
      <TableCell className="font-medium text-[#0d2745] text-xs">
        {col.column}
      </TableCell>
      <TableCell>
        <Input
          name="displayName"
          value={col.displayName || ""}
          onChange={(e) => handleColumnChange(col, e)}
          className="h-7 text-xs border-[#c8dced] text-[#0d2745] rounded px-2"
        />
      </TableCell>
      <TableCell className="w-[140px]">
        <Select
          value={col.filter_type || "none"}
          onValueChange={(val) => handleSelectFilterType(col, val)}
        >
          <SelectTrigger className="h-7 text-xs border-[#c8dced] text-[#0d2745]">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent className="text-xs border-[#c8dced]">
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="date_range">Date Range</SelectItem>
            <SelectItem value="numeric_date_range">Numeric Date Range</SelectItem>
            <SelectItem value="number_range">Number Range</SelectItem>
            <SelectItem value="dropdown">Dropdown</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}

type Report = {
  id?: number;
  report_name: string;
  report_view: string;
  workspaceId: number;
  database_schema: string;
};

const reportSchema = z.object({
  report_name: z.string().min(2, "Report name is required"),
  report_view: z.string().min(2, "Report view is required"),
  workspaceId: z.number().min(1, "Workspace ID is required"),
  database_schema: z.string().min(2, "Database schema is required"),
});

const ReportConfiguration = () => {
  const [selectedReport, setSelectedReport] = useState<any>({});
  const [workspaces, setWorkspaces] = useState<any>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [reports, setReports] = useState<any>([]);
  const [verifystatus, setVerifyStatus] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchReports();
    fetchWorkspaces();
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

  const fetchReports = async () => {
    try {
      const res = await findAllReports();
      if (res.status === 200) {
        setReports(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      report_name: "",
      report_view: "",
      workspaceId: 0,
      database_schema: "",
    },
  });

  const onSubmit = async (data: Report) => {
    try {
      const finalColumns = columns.map((c, i) => ({
        ...c,
        sort_order: i + 1,
      }));

      const response = await createReport({
        id: selectedReport?.id ? selectedReport.id : 0,
        report_name: data.report_name,
        report_view: data.report_view,
        workspaceId: data.workspaceId,
        database_schema: data.database_schema,
        columns: finalColumns,
      });

      if (response.status === 201) {
        setSelectedReport({});
        setColumns([]);
        form.reset();
        setVerifyStatus(0);
        fetchReports();
        toast.success(selectedReport?.id ? "Report updated" : "Report saved");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    }
  };

  const handleVerify = async () => {
    setVerifyStatus(1);
    const { database_schema, report_view } = form.getValues();
    if (!database_schema || !report_view) return;

    try {
      const response = await getColumnListBySchemaAndView({
        schema: database_schema,
        view: report_view,
      });
      if (response.status === 201) {
        setColumns(
          response.data.columns.map((col: string, index: number) => ({
            column: col,
            displayName: col,
            hidden: false,
            sort_order: index + 1,
            filter_type: null,
          }))
        );
      } else {
        toast.error("Verification failed");
      }
      setVerifyStatus(2);
    } catch (error: any) {
      console.error("Error:", error.message);
      setVerifyStatus(0);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.column === active.id);
        const newIndex = items.findIndex((item) => item.column === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleColumnChange = (column: any, e: any) => {
    const updated = [...columns];
    const idx = updated.findIndex((col) => col.column === column.column);
    if (idx === -1) return;

    if (e.target.name === "displayName") {
      updated[idx].displayName = e.target.value;
    } else if (e.target.name === "hidden") {
      updated[idx].hidden = e.target.checked;
    }
    setColumns(updated);
  };

  const handleSelectFilterType = (column: any, filterType: any) => {
    const updated = columns.map((col: any) => {
      if (col.column === column.column) {
        return { ...col, filter_type: filterType === "none" ? null : filterType };
      }
      return col;
    });
    setColumns(updated);
  };

  const handleEdit = (report: any) => {
    setSelectedReport(report);
    form.setValue("report_name", report.report_name);
    form.setValue("report_view", report.report_view);
    form.setValue("database_schema", report.database_schema);
    form.setValue("workspaceId", report.workspace?.id);

    const sortedCols = [...(report.columns || [])].sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    );
    setColumns(sortedCols);
  };

  const handleDelete = async (reportid: any) => {
    try {
      const response = await deleteReport(reportid);
      if (response.status === 200) {
        toast.success("Successfully Deleted");
        fetchReports();
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleCancel = () => {
    form.reset({
      report_name: "",
      report_view: "",
      workspaceId: 0,
      database_schema: "",
    });
    setSelectedReport({});
    setColumns([]);
    setVerifyStatus(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
      {/* Left Column: Form Card */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-[#c8dced] p-5 shadow-2xs">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="report_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">
                    Report name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Demo User Report"
                      className="h-8 text-xs border-[#c8dced] text-[#0d2745] rounded-md shadow-none focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="database_schema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">
                    Database Schema
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="public"
                      className="h-8 text-xs border-[#c8dced] text-[#0d2745] rounded-md shadow-none focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="report_view"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">
                    Report View
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="user"
                        className="h-8 text-xs border-[#c8dced] text-[#0d2745] rounded-md shadow-none focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      disabled={!form.watch("database_schema") || !form.watch("report_view")}
                      variant="outline"
                      className="h-8 text-xs font-semibold px-4 border-[#c8dced] text-[#0e2947] hover:bg-[#eaf4fd]"
                      onClick={handleVerify}
                    >
                      {verifystatus === 2 ? (
                        "Verified"
                      ) : verifystatus === 1 ? (
                        <Loader2 className="animate-spin w-3 h-3" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                  <FormMessage className="text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Columns Table with Drag and Drop */}
            {columns.length > 0 && (
              <div className="pt-2">
                <span className="text-[12px] font-bold text-[#0d2745] block mb-2">
                  Columns
                </span>
                <div className="border border-[#c8dced] rounded-lg overflow-x-auto">
                  <Table className="text-xs min-w-[420px]">
                    <TableHeader className="bg-[#dbe9f6]">
                      <TableRow className="border-[#c8dced]">
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead className="w-[50px] text-[11px] font-bold text-[#0a1c30] uppercase text-center whitespace-nowrap">
                          ORDER
                        </TableHead>
                        <TableHead className="w-[50px] text-[11px] font-bold text-[#0a1c30] uppercase text-center whitespace-nowrap">
                          HIDE
                        </TableHead>
                        <TableHead className="text-[11px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                          COLUMN NAME
                        </TableHead>
                        <TableHead className="text-[11px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                          DISPLAY NAME
                        </TableHead>
                        <TableHead className="w-[140px] text-[11px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                          FILTER TYPE
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={columns.map((c) => c.column)}
                          strategy={verticalListSortingStrategy}
                        >
                          {columns.map((col: any, index: number) => (
                            <SortableColumnRow
                              key={col.column}
                              col={col}
                              index={index}
                              handleColumnChange={handleColumnChange}
                              handleSelectFilterType={handleSelectFilterType}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Workspace Select */}
            <FormField
              control={form.control}
              name="workspaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[12px] font-bold text-[#0d2745]">
                    Workspace
                  </FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(val) => field.onChange(Number(val))}
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
                {selectedReport?.id ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right Column: Existing Reports */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-[#c8dced] p-5 shadow-2xs">
        <h2 className="text-[13px] font-bold text-[#0a1c30] mb-3">Existing reports</h2>
        <div className="overflow-x-auto w-full">
          <Table className="text-xs min-w-[380px]">
            <TableHeader className="bg-[#dbe9f6]">
              <TableRow className="border-[#c8dced]">
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                  REPORT NAME
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                  VIEW
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                  WORKSPACE
                </TableHead>
                <TableHead className="text-center text-[10px] font-bold text-[#0a1c30] uppercase whitespace-nowrap">
                  ACTION
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-[#4a759f]">
                    No reports configured
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report: any) => (
                  <TableRow key={report.id} className="border-[#c8dced] hover:bg-[#eaf4fd] transition-colors">
                    <TableCell className="font-medium text-[#0d2745] whitespace-nowrap">
                      {report.report_name}
                    </TableCell>
                    <TableCell className="text-[#2b5278] whitespace-nowrap">{report.report_view}</TableCell>
                    <TableCell className="text-[#2b5278] whitespace-nowrap">
                      {report.workspace?.name}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => handleEdit(report)}
                          className="border border-[#c8dced] rounded px-2.5 py-0.5 text-[11px] text-[#0e2947] hover:bg-[#eaf4fd] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(report.id)}
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

export default ReportConfiguration;
