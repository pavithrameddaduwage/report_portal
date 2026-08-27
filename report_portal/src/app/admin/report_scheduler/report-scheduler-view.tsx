"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  findAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleScheduleActive,
  runScheduleNow,
  findAllScheduleLogs,
  getSchedulerStats,
  ReportScheduleItem,
  ScheduleLogItem,
  ScheduleRecipient,
} from "@/services/scheduler-service";
import { findAllWorkspaces } from "@/services/workspace-services";
import { findReportsByWorkspaceId, findAllDisplayViews } from "@/services/report-service";
import { searchADUsers } from "@/services/authentication-service";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Mail,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Search,
  FileSpreadsheet,
  FileText,
  Activity,
  Send,
  Loader2,
  X,
  UserCheck,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ReportSchedulerView() {
  const [activeTab, setActiveTab] = useState<"schedules" | "logs">("schedules");

  // Data states
  const [schedules, setSchedules] = useState<ReportScheduleItem[]>([]);
  const [logs, setLogs] = useState<ScheduleLogItem[]>([]);
  const [stats, setStats] = useState<any>({
    totalSchedules: 0,
    activeSchedules: 0,
    totalSentToday: 0,
    successRate: 100,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState<boolean>(false);
  const [runningScheduleId, setRunningScheduleId] = useState<number | null>(null);

  // Dropdown dependency states
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [displayViews, setDisplayViews] = useState<any[]>([]);
  const [filteredDisplayViews, setFilteredDisplayViews] = useState<any[]>([]);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    schedule_name: string;
    workspace_id: number | null;
    report_id: number | null;
    display_view_id: number | null;
    frequency_type: "ONE_TIME" | "MANUAL" | "DAILY" | "WEEKLY" | "MONTHLY" | "HOURLY" | "CUSTOM";

    time: string;
    days: string[];
    dayOfMonth: number;
    customCron: string;
    recipients: ScheduleRecipient[];
    email_subject: string;
    email_body: string;
    export_format: "CSV" | "EXCEL";
    is_active: boolean;
  }>({
    schedule_name: "",
    workspace_id: null,
    report_id: null,
    display_view_id: null,
    frequency_type: "DAILY",
    time: "08:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    dayOfMonth: 1,
    customCron: "0 8 * * *",
    recipients: [],
    email_subject: "",
    email_body: "",
    export_format: "CSV",
    is_active: true,
  });

  // AD User Search State
  const [adSearchQuery, setAdSearchQuery] = useState<string>("");
  const [adSuggestions, setAdSuggestions] = useState<any[]>([]);
  const [isSearchingAD, setIsSearchingAD] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchTimeoutRef = useRef<any>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search and Filter States
  const [schedulesSearchQuery, setSchedulesSearchQuery] = useState<string>("");
  const [logsSearchQuery, setLogsSearchQuery] = useState<string>("");
  const [logsStatusFilter, setLogsStatusFilter] = useState<string>("ALL");



  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle outside click for AD suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchSchedules(),
        fetchLogs(),
        fetchStats(),
        fetchWorkspacesAndViews(),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await findAllSchedules();
      if (res?.data) setSchedules(res.data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await findAllScheduleLogs();
      if (res?.data) setLogs(res.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await getSchedulerStats();
      if (res?.data) setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchWorkspacesAndViews = async () => {
    try {
      const [wsRes, dvRes] = await Promise.all([
        findAllWorkspaces(),
        findAllDisplayViews(),
      ]);
      if (wsRes?.data) setWorkspaces(wsRes.data);
      if (dvRes?.data) setDisplayViews(dvRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  // When workspace changes in form, load its reports
  const handleWorkspaceChange = async (wsIdStr: string) => {
    const wsId = parseInt(wsIdStr, 10);
    setFormData((prev) => ({
      ...prev,
      workspace_id: wsId,
      report_id: null,
      display_view_id: null,
    }));
    setReports([]);
    setFilteredDisplayViews([]);

    try {
      const res = await findReportsByWorkspaceId(wsId);
      if (res?.data) setReports(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // When report changes, filter display views
  const handleReportChange = (reportIdStr: string) => {
    const repId = parseInt(reportIdStr, 10);
    setFormData((prev) => ({
      ...prev,
      report_id: repId,
      display_view_id: null,
    }));

    const matchedDVs = displayViews.filter((dv: any) => dv.report?.id === repId);
    setFilteredDisplayViews(matchedDVs);

    // Auto-generate title if blank
    const selReport = reports.find((r) => r.id === repId);
    if (selReport && !formData.schedule_name) {
      setFormData((prev) => ({
        ...prev,
        schedule_name: `${selReport.report_name} Daily Schedule`,
        email_subject: `[Report Portal] ${selReport.report_name} Scheduled Export`,
      }));
    }
  };

  // When display view changes, auto update title & email subject
  const handleDisplayViewChange = (dvIdStr: string) => {
    const dvId = parseInt(dvIdStr, 10);
    const selDV = displayViews.find((d: any) => d.id === dvId);
    const selReport = reports.find((r) => r.id === formData.report_id);

    setFormData((prev) => ({
      ...prev,
      display_view_id: dvId,
      schedule_name: selDV && selReport ? `${selReport.report_name} - ${selDV.displayview_name} Schedule` : prev.schedule_name,
      email_subject: selDV && selReport ? `[Report Portal] ${selReport.report_name} - ${selDV.displayview_name} Report` : prev.email_subject,
    }));
  };

  // Active Directory user search debounce
  const handleADSearchChange = (query: string) => {
    setAdSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setAdSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingAD(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await searchADUsers(query.trim());
        const list = res?.data || [];
        setAdSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch (err) {
        console.error("AD search error:", err);
      } finally {
        setIsSearchingAD(false);
      }
    }, 300);
  };

  const addRecipient = (user: { name: string; email: string; department?: string }) => {
    const email = user.email.toLowerCase().trim();
    if (formData.recipients.some((r) => r.email.toLowerCase() === email)) {
      toast.info("User already added as recipient");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      recipients: [...prev.recipients, { name: user.name, email: email, department: user.department }],
    }));
    setAdSearchQuery("");
    setShowSuggestions(false);
  };

  const addManualEmail = () => {
    const email = adSearchQuery.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (formData.recipients.some((r) => r.email.toLowerCase() === email)) {
      toast.info("Email already added");
      return;
    }
    const name = email.split("@")[0];
    setFormData((prev) => ({
      ...prev,
      recipients: [...prev.recipients, { name, email, department: "External/Manual" }],
    }));
    setAdSearchQuery("");
    setShowSuggestions(false);
  };

  const removeRecipient = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r.email !== email),
    }));
  };

  // Open modal for new schedule
  const handleOpenCreateModal = () => {
    fetchWorkspacesAndViews();
    setEditingScheduleId(null);
    setFormData({
      schedule_name: "",
      workspace_id: null,
      report_id: null,
      display_view_id: null,
      frequency_type: "DAILY",
      time: "08:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      dayOfMonth: 1,
      customCron: "0 8 * * *",
      recipients: [],
      email_subject: "",
      email_body: "Please find attached your scheduled CSV report export from Horizon Report Portal.",
      export_format: "CSV",
      is_active: true,
    });
    setReports([]);
    setFilteredDisplayViews([]);
    setIsDialogOpen(true);
  };

  // Open modal for editing schedule
  const handleOpenEditModal = async (schedule: ReportScheduleItem) => {
    fetchWorkspacesAndViews();
    setEditingScheduleId(schedule.id || null);


    // Fetch reports for this workspace
    if (schedule.workspace_id) {
      try {
        const res = await findReportsByWorkspaceId(schedule.workspace_id);
        if (res?.data) setReports(res.data);
      } catch (e) {}
    }

    if (schedule.report_id) {
      const matchedDVs = displayViews.filter((dv: any) => dv.report?.id === schedule.report_id);
      setFilteredDisplayViews(matchedDVs);
    }

    const freqDetails = schedule.frequency_details || {};

    setFormData({
      schedule_name: schedule.schedule_name,
      workspace_id: schedule.workspace_id,
      report_id: schedule.report_id,
      display_view_id: schedule.display_view_id || null,
      frequency_type: schedule.frequency_type || "DAILY",
      time: freqDetails.time || "08:00",
      days: freqDetails.days || ["Monday"],
      dayOfMonth: freqDetails.dayOfMonth || 1,
      customCron: schedule.cron_expression || "0 8 * * *",
      recipients: schedule.recipients || [],
      email_subject: schedule.email_subject || "",
      email_body: schedule.email_body || "",
      export_format: schedule.export_format || "CSV",
      is_active: schedule.is_active,
    });

    setIsDialogOpen(true);
  };

  // Save Schedule (Create / Update)
  const handleSaveSchedule = async () => {
    if (!formData.schedule_name.trim()) {
      toast.error("Please enter a schedule name");
      return;
    }
    if (!formData.workspace_id) {
      toast.error("Please select a workspace");
      return;
    }
    if (!formData.report_id) {
      toast.error("Please select a report");
      return;
    }
    if (formData.recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }
    if (!formData.workspace_id) {
      toast.error("Please select a workspace");
      return;
    }
    if (!formData.report_id) {
      toast.error("Please select a report");
      return;
    }
    if (formData.recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    const selWs = workspaces.find((w) => w.id === formData.workspace_id);
    const selRep = reports.find((r) => r.id === formData.report_id);
    const selDV = displayViews.find((d: any) => d.id === formData.display_view_id);

    const scheduleName = formData.schedule_name.trim() || `${selRep?.report_name || 'Report'} Dispatch`;

    const payload: any = {
      schedule_name: scheduleName,
      workspace_id: formData.workspace_id,
      workspace_name: selWs?.workspace_name || selWs?.name || "",
      report_id: formData.report_id,
      report_name: selRep?.report_name || "",
      display_view_id: formData.display_view_id || null,
      display_view_name: selDV?.displayview_name || "",
      frequency_type: formData.frequency_type,
      frequency_details: {
        time: formData.time,
        days: formData.days,
        dayOfMonth: formData.dayOfMonth,
        cron: formData.customCron,
      },
      recipients: formData.recipients,
      email_subject: formData.email_subject || `[Report Portal] ${selRep?.report_name || 'Report'} Export`,
      email_body: formData.email_body,
      export_format: formData.export_format,
      is_active: formData.frequency_type === "ONE_TIME" ? false : formData.is_active,
    };

    setIsSubmitting(true);
    try {
      if (editingScheduleId) {
        await updateSchedule(editingScheduleId, payload);
        toast.success("Schedule updated successfully");
      } else {
        await createSchedule(payload);
        toast.success(formData.frequency_type === "ONE_TIME" ? "Report dispatched successfully" : "Schedule created");
      }
      setIsDialogOpen(false);
      await fetchSchedules();
      await fetchLogs();
      await fetchStats();
    } catch (error: any) {
      toast.error("Failed to save schedule", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Immediate One-Time Send Handler
  const handleSendNowDirect = async () => {
    if (!formData.workspace_id) {
      toast.error("Please select a workspace");
      return;
    }
    if (!formData.report_id) {
      toast.error("Please select a report");
      return;
    }
    if (formData.recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    const selWs = workspaces.find((w) => w.id === formData.workspace_id);
    const selRep = reports.find((r) => r.id === formData.report_id);
    const selDV = displayViews.find((d: any) => d.id === formData.display_view_id);

    const payload: any = {
      schedule_name: formData.schedule_name.trim() || `${selRep?.report_name || 'Report'} Manual Send`,
      workspace_id: formData.workspace_id,
      workspace_name: selWs?.workspace_name || selWs?.name || "",
      report_id: formData.report_id,
      report_name: selRep?.report_name || "",
      display_view_id: formData.display_view_id || null,
      display_view_name: selDV?.displayview_name || "",
      frequency_type: "ONE_TIME",
      frequency_details: {},
      recipients: formData.recipients,
      email_subject: formData.email_subject || `[Report Portal] ${selRep?.report_name || 'Report'} Export`,
      email_body: formData.email_body,
      export_format: formData.export_format,
      is_active: false,
    };


    setIsSubmitting(true);
    const toastId = toast.loading(`Generating ${formData.export_format} and dispatching email...`);
    try {
      await createSchedule(payload);
      toast.success(`Dispatched to ${formData.recipients.length} recipient(s)`, { id: toastId });
      setIsDialogOpen(false);
      await fetchSchedules();
      await fetchLogs();
      await fetchStats();
    } catch (error: any) {
      toast.error("Failed to send report", {
        id: toastId,
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleScheduleActive(id);
      toast.success("Schedule status updated");
      fetchSchedules();
      fetchStats();
    } catch (err) {
      toast.error("Could not toggle status");
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete schedule "${name}"?`)) return;
    try {
      await deleteSchedule(id);
      toast.success(`Schedule "${name}" deleted`);
      fetchSchedules();
      fetchStats();
    } catch (err) {
      toast.error("Failed to delete schedule");
    }
  };

  // Manual Trigger: "Run Now"
  const handleRunNow = async (id: number, name: string) => {
    setRunningScheduleId(id);
    const toastId = toast.loading(`Generating CSV and dispatching emails for "${name}"...`);
    try {
      const res = await runScheduleNow(id);
      if (res.data?.success) {
        toast.success(`Sent! ${res.data.message}`, { id: toastId });
      } else {
        toast.error(`Execution failed: ${res.data?.message || 'Check logs for details'}`, { id: toastId });
      }
      await fetchSchedules();
      await fetchLogs();
      await fetchStats();
    } catch (err: any) {
      toast.error("Failed to run schedule", {
        id: toastId,
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setRunningScheduleId(null);
    }
  };

  // Refresh Logs Tab
  const handleRefreshLogs = async () => {
    setIsRefreshingLogs(true);
    await fetchLogs();
    await fetchStats();
    setIsRefreshingLogs(false);
    toast.success("Logs refreshed");
  };

  // Frequency Badge Formatter

  const getFrequencyBadge = (schedule: ReportScheduleItem) => {
    if (schedule.frequency_type === "ONE_TIME") return "One-Time Send";
    if (schedule.frequency_type === "DAILY") return `Daily at ${schedule.frequency_details?.time || "08:00"}`;
    if (schedule.frequency_type === "WEEKLY") return `Weekly (${(schedule.frequency_details?.days || []).join(", ")}) at ${schedule.frequency_details?.time || "08:00"}`;
    if (schedule.frequency_type === "MONTHLY") return `Monthly (Day ${schedule.frequency_details?.dayOfMonth || 1}) at ${schedule.frequency_details?.time || "08:00"}`;
    if (schedule.frequency_type === "HOURLY") return "Every Hour";
    if (schedule.frequency_type === "CUSTOM") return `Custom (${schedule.cron_expression || ""})`;
    return schedule.frequency_type || "Daily";
  };

  // Filtered Schedules
  const filteredSchedules = schedules.filter((schedule) => {
    if (!schedulesSearchQuery) return true;
    const q = schedulesSearchQuery.toLowerCase();
    return (
      schedule.schedule_name?.toLowerCase().includes(q) ||
      schedule.report_name?.toLowerCase().includes(q) ||
      schedule.workspace_name?.toLowerCase().includes(q) ||
      (schedule.recipients || []).some((r: any) => (r.email || r.name || "").toLowerCase().includes(q))
    );
  });

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !logsSearchQuery ||
      log.schedule_name?.toLowerCase().includes(logsSearchQuery.toLowerCase()) ||
      log.report_name?.toLowerCase().includes(logsSearchQuery.toLowerCase()) ||
      log.display_view_name?.toLowerCase().includes(logsSearchQuery.toLowerCase()) ||
      (log.recipients || []).some((r) => r.toLowerCase().includes(logsSearchQuery.toLowerCase()));

    const matchesStatus =
      logsStatusFilter === "ALL" || log.status === logsStatusFilter;

    return matchesSearch && matchesStatus;
  });


  return (
    <div className="space-y-4">
      {/* Tabs System & Actions */}
      <div className="bg-white border border-[#dce6f1] rounded-2xl overflow-hidden shadow-xs">
        {/* Tab Headers and Top Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5edf5] px-6 pt-4 pb-3 gap-4 bg-[#fafbfc]">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab("schedules")}
              className={`pb-1 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "schedules"
                  ? "border-[#0b2138] text-[#0b2138]"
                  : "border-transparent text-[#5c7f9f] hover:text-[#0b2138]"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Configured Schedules ({schedules.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`pb-1 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "logs"
                  ? "border-[#0b2138] text-[#0b2138]"
                  : "border-transparent text-[#5c7f9f] hover:text-[#0b2138]"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Execution Logs ({logs.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenCreateModal}
              className="h-8 px-4 text-xs font-semibold bg-[#0b2138] hover:bg-[#163e6b] text-white rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Schedule</span>
            </Button>
          </div>
        </div>


        {/* Tab 1: Schedules Table */}
        {activeTab === "schedules" && (
          <div className="p-6 space-y-4">
            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Input
                  placeholder="Search schedules..."
                  value={schedulesSearchQuery}
                  onChange={(e) => setSchedulesSearchQuery(e.target.value)}
                  className="h-9 text-xs pl-8 border-[#dce6f1] rounded-lg"
                />

                <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Schedules Table */}
            {filteredSchedules.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#8aa6bf] flex flex-col items-center gap-2">
                <Calendar className="w-8 h-8 text-[#8aa6bf] opacity-50" />
                <span>No report schedules found. Click "New Schedule" to create one.</span>
              </div>
            ) : (
              <div className="rounded-xl border border-[#e5edf5] overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#f8fafc]">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Schedule Name</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Workspace / Report</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Display View</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Frequency</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Recipients</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Format</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Status</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.map((schedule) => (
                      <TableRow key={schedule.id} className="hover:bg-[#fbfcfd]">
                        <TableCell className="font-semibold text-xs text-[#0b2138]">
                          {schedule.schedule_name}
                        </TableCell>

                        <TableCell>
                          <div className="text-xs font-bold text-[#0b2138]">{schedule.report_name}</div>
                          <div className="text-[11px] text-[#5c7f9f]">{schedule.workspace_name}</div>
                        </TableCell>

                        <TableCell>
                          {schedule.display_view_name ? (
                            <span className="text-xs font-medium text-[#0052cc] bg-[#eef5fc] px-2 py-0.5 rounded border border-[#d2e4f7]">
                              {schedule.display_view_name}
                            </span>
                          ) : (
                            <span className="text-xs text-[#8aa6bf]">Standard (All)</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-xs text-[#0b2138] font-medium bg-[#f0f4f8] px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-[#5c7f9f]" />
                            <span>{getFrequencyBadge(schedule)}</span>
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-[#0b2138]">
                            <Mail className="w-3 h-3 text-[#2f8fe0]" />
                            <span className="font-semibold">{schedule.recipients?.length || 0} users</span>
                          </div>
                          <div className="text-[11px] text-[#5c7f9f] truncate max-w-[180px]" title={schedule.recipients?.map((r) => r.email).join(", ")}>
                            {schedule.recipients?.map((r) => r.name || r.email).join(", ")}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-[11px] font-bold text-[#0b2138] bg-[#e6f4ea] text-[#137333] px-2 py-0.5 rounded uppercase">
                            {schedule.export_format || "CSV"}
                          </span>
                        </TableCell>

                        <TableCell>
                          {schedule.frequency_type === "ONE_TIME" || schedule.frequency_type === "MANUAL" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                              One-Time
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => schedule.id && handleToggleActive(schedule.id, e)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                schedule.is_active
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${schedule.is_active ? "bg-emerald-600" : "bg-gray-400"}`} />
                              <span>{schedule.is_active ? "Active" : "Paused"}</span>
                            </button>
                          )}
                        </TableCell>


                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Send Now / Retry Button (Only displayed when schedule failed) */}
                            {schedule.last_run_status === "FAILED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={runningScheduleId === schedule.id}
                                onClick={() => schedule.id && handleRunNow(schedule.id, schedule.schedule_name)}
                                className="h-8 text-xs px-2.5 text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Retry failed schedule dispatch"
                              >
                                {runningScheduleId === schedule.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <RefreshCw className="w-3 h-3 text-amber-600" />
                                    <span>Send Now</span>
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Edit Button */}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(schedule)}
                              className="h-8 w-8 p-0 text-[#5c7f9f] hover:text-[#0b2138] hover:bg-[#f0f4f8] rounded-lg cursor-pointer"
                              title="Edit Schedule"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => schedule.id && handleDeleteSchedule(schedule.id, schedule.schedule_name)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete Schedule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Execution Logs Table */}
        {activeTab === "logs" && (
          <div className="p-6 space-y-4">
            {/* Logs Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Input
                    placeholder="Search logs..."
                    value={logsSearchQuery}
                    onChange={(e) => setLogsSearchQuery(e.target.value)}
                    className="h-9 text-xs pl-8 border-[#dce6f1] rounded-lg"
                  />
                  <Search className="w-3.5 h-3.5 text-[#8aa6bf] absolute left-2.5 top-3 pointer-events-none" />
                </div>

                <Select value={logsStatusFilter} onValueChange={setLogsStatusFilter}>
                  <SelectTrigger className="h-9 w-32 text-xs border-[#dce6f1] rounded-lg">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="SUCCESS">Success Only</SelectItem>
                    <SelectItem value="FAILED">Failed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshLogs}
                disabled={isRefreshingLogs}
                className="h-9 text-xs border-[#dce6f1] text-[#0b2138] rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLogs ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>

            {/* Logs Table */}
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#8aa6bf] flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-[#8aa6bf] opacity-50" />
                <span>No execution logs recorded yet.</span>
              </div>
            ) : (
              <div className="rounded-xl border border-[#e5edf5] overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#f8fafc]">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Execution Time</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Schedule / Report</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Display View</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Recipients Sent</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Trigger</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Records</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138]">Duration</TableHead>
                      <TableHead className="text-xs font-bold text-[#0b2138] text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-[#fbfcfd]">
                        <TableCell className="font-mono text-xs text-[#0b2138]">
                          {new Date(log.execution_time).toLocaleString([], {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </TableCell>

                        <TableCell>
                          <div className="font-bold text-xs text-[#0b2138]">{log.schedule_name}</div>
                          <div className="text-[11px] text-[#5c7f9f]">{log.report_name}</div>
                        </TableCell>

                        <TableCell>
                          {log.display_view_name ? (
                            <span className="text-xs font-medium text-[#0052cc] bg-[#eef5fc] px-2 py-0.5 rounded border border-[#d2e4f7]">
                              {log.display_view_name}
                            </span>
                          ) : (
                            <span className="text-xs text-[#8aa6bf]">Standard Report</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="text-xs text-[#0b2138]">
                            <span className="font-semibold">{(log.recipients || []).length} recipient(s)</span>
                          </div>
                          <div className="text-[11px] text-[#5c7f9f] truncate max-w-[200px]" title={(log.recipients || []).join(", ")}>
                            {(log.recipients || []).join(", ")}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.triggered_by === "MANUAL"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-blue-50 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {log.triggered_by === "MANUAL" ? "Manual Run" : "Scheduled Cron"}
                          </span>
                        </TableCell>

                        <TableCell className="text-xs font-semibold text-[#0b2138]">
                          {log.records_count?.toLocaleString() || 0} rows
                        </TableCell>

                        <TableCell className="text-xs text-[#5c7f9f] font-mono">
                          {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(2)}s` : "-"}
                        </TableCell>

                        <TableCell className="text-right">
                          {log.status === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Delivered</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 cursor-help"
                              title={log.error_message || "Delivery failed"}
                            >
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Failed</span>
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE / EDIT SCHEDULE DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-5xl md:max-w-5xl lg:max-w-6xl w-[95vw] max-w-[1150px] p-8 bg-white rounded-2xl shadow-2xl border border-[#dce6f1]">
          <DialogHeader className="pb-4 border-b border-[#e5edf5]">
            <DialogTitle className="text-xl font-bold text-[#0b2138]">
              {editingScheduleId ? "Edit Report Schedule" : "Create Report Schedule"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5c7f9f] mt-0.5">
              Configure automated delivery or send reports immediately to team members.
            </DialogDescription>
          </DialogHeader>

          {/* 2-Column Spacious Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-5">
            {/* Left Column: Report & Timing Configuration */}
            <div className="lg:col-span-6 space-y-5">
              {/* Schedule Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0b2138] block">
                  Schedule Title <span className="text-[#8aa6bf] font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="Schedule title (optional)"
                  value={formData.schedule_name}
                  onChange={(e) => setFormData({ ...formData, schedule_name: e.target.value })}
                  className="h-10 text-xs border-[#dce6f1] rounded-xl focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                />
              </div>

              {/* Workspace, Report & Display View */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Workspace */}
                <div className="space-y-1.5 min-w-0">
                  <label className="text-xs font-bold text-[#0b2138] block">
                    Workspace <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.workspace_id ? String(formData.workspace_id) : ""}
                    onValueChange={handleWorkspaceChange}
                  >
                    <SelectTrigger className="h-9.5 text-xs border-[#dce6f1] rounded-xl w-full">
                      <SelectValue placeholder="Workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaces.map((ws) => (
                        <SelectItem key={ws.id} value={String(ws.id)}>
                          {ws.workspace_name || ws.name}
                        </SelectItem>
                      ))}
                    </SelectContent>

                  </Select>
                </div>

                {/* Report */}
                <div className="space-y-1.5 min-w-0">
                  <label className="text-xs font-bold text-[#0b2138] block">
                    Report <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.report_id ? String(formData.report_id) : ""}
                    onValueChange={handleReportChange}
                    disabled={!formData.workspace_id}
                  >
                    <SelectTrigger className="h-9.5 text-xs border-[#dce6f1] rounded-xl w-full">
                      <SelectValue placeholder="Report" />
                    </SelectTrigger>
                    <SelectContent>
                      {reports.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.report_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Display View */}
                <div className="space-y-1.5 min-w-0">
                  <label className="text-xs font-bold text-[#0b2138] block">Display View</label>
                  <Select
                    value={formData.display_view_id ? String(formData.display_view_id) : "none"}
                    onValueChange={(val) => {
                      if (val === "none") {
                        setFormData({ ...formData, display_view_id: null });
                      } else {
                        handleDisplayViewChange(val);
                      }
                    }}
                    disabled={!formData.report_id}
                  >
                    <SelectTrigger className="h-9.5 text-xs border-[#dce6f1] rounded-xl w-full">
                      <SelectValue placeholder="Standard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Standard</SelectItem>
                      {filteredDisplayViews.map((dv: any) => (
                        <SelectItem key={dv.id} value={String(dv.id)}>
                          {dv.displayview_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Export Format & Frequency Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-xs font-bold text-[#0b2138] block">Export Format</label>
                  <Select
                    value={formData.export_format}
                    onValueChange={(val: any) => setFormData({ ...formData, export_format: val })}
                  >
                    <SelectTrigger className="h-9.5 text-xs border-[#dce6f1] rounded-xl w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSV">CSV (.csv)</SelectItem>
                      <SelectItem value="EXCEL">Excel (.xlsx)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="text-xs font-bold text-[#0b2138] block">Frequency</label>
                  <Select
                    value={formData.frequency_type}
                    onValueChange={(val: any) => setFormData({ ...formData, frequency_type: val })}
                  >
                    <SelectTrigger className="h-9.5 text-xs border-[#dce6f1] rounded-xl w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONE_TIME">One-Time (Manual Send)</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="HOURLY">Hourly</SelectItem>
                      <SelectItem value="CUSTOM">Custom Cron</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Frequency Timing Configurator Card */}
              {formData.frequency_type === "ONE_TIME" && (
                <div className="p-3.5 bg-[#f0f7ff] border border-[#d2e4f7] rounded-xl text-xs text-[#0052cc] flex items-center gap-2">
                  <Send className="w-4 h-4 shrink-0" />
                  <span>This report will be sent manually or one-time without recurring schedule triggers.</span>
                </div>
              )}

              {formData.frequency_type !== "HOURLY" && formData.frequency_type !== "CUSTOM" && formData.frequency_type !== "ONE_TIME" && (
                <div className="p-4 bg-[#f8fafc] border border-[#e5edf5] rounded-2xl space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#0b2138] uppercase tracking-wide">
                        Execution Time
                      </label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="h-8.5 text-xs w-36 border-[#dce6f1] rounded-xl bg-white"
                      />
                    </div>

                    {formData.frequency_type === "MONTHLY" && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#0b2138] uppercase tracking-wide">
                          Day of Month
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          value={formData.dayOfMonth}
                          onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value, 10) || 1 })}
                          className="h-8.5 text-xs w-28 border-[#dce6f1] rounded-xl bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {formData.frequency_type === "WEEKLY" && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-[#0b2138] uppercase tracking-wide">
                        Select Execution Days
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = formData.days.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const newDays = isSelected
                                  ? formData.days.filter((d) => d !== day)
                                  : [...formData.days, day];
                                setFormData({ ...formData, days: newDays });
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-[#0b2138] text-white shadow-2xs"
                                  : "bg-white border border-[#dce6f1] text-[#5c7f9f] hover:border-[#0b2138]"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData.frequency_type === "CUSTOM" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0b2138] block">Cron Expression</label>
                  <Input
                    placeholder="0 9 * * 1-5"
                    value={formData.customCron}
                    onChange={(e) => setFormData({ ...formData, customCron: e.target.value })}
                    className="h-9.5 text-xs border-[#dce6f1] font-mono rounded-xl"
                  />
                </div>
              )}

              {/* Active Toggle */}
              {formData.frequency_type !== "ONE_TIME" && (
                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0b2138] accent-[#0b2138] cursor-pointer"
                  />
                  <label htmlFor="is_active" className="text-xs font-semibold text-[#0b2138] cursor-pointer select-none">
                    Enable schedule immediately (Active status)
                  </label>
                </div>
              )}
            </div>

            {/* Right Column: Recipients & Email Configuration */}
            <div className="lg:col-span-6 space-y-5">
              {/* Active Directory Recipients Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0b2138]">
                    Recipient Users <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[#2f8fe0]">
                    {formData.recipients.length} selected
                  </span>
                </div>

                {/* AD Search Bar */}
                <div className="relative" ref={suggestionsRef}>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Search users..."
                        value={adSearchQuery}
                        onChange={(e) => handleADSearchChange(e.target.value)}
                        onFocus={() => {
                          if (adSuggestions.length > 0) setShowSuggestions(true);
                        }}
                        className="h-10 text-xs pl-9 border-[#dce6f1] rounded-xl shadow-2xs"
                      />
                      <Search className="w-4 h-4 text-[#8aa6bf] absolute left-3 top-3 pointer-events-none" />
                      {isSearchingAD && (
                        <Loader2 className="w-4 h-4 text-[#2f8fe0] animate-spin absolute right-3 top-3" />
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addManualEmail}
                      className="h-10 px-4 text-xs border-[#dce6f1] text-[#0b2138] rounded-xl cursor-pointer hover:bg-[#eef5fc]"
                    >
                      Add
                    </Button>
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && adSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#dce6f1] rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto">
                      {adSuggestions.map((user, idx) => (
                        <div
                          key={idx}
                          onClick={() => addRecipient(user)}
                          className="p-3 hover:bg-[#eef5fc] cursor-pointer flex items-center justify-between border-b border-[#f0f4f8] last:border-0 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#0b2138] text-white flex items-center justify-center text-xs font-bold">
                              {user.name ? user.name[0].toUpperCase() : "U"}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#0b2138]">{user.name}</div>
                              <div className="text-[11px] text-[#5c7f9f]">{user.email}</div>
                            </div>
                          </div>
                          {user.department && (
                            <span className="text-[10px] bg-[#f0f4f8] text-[#5c7f9f] px-2 py-0.5 rounded font-medium">
                              {user.department}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recipient Chips Container */}
                <div className="flex flex-wrap gap-1.5 p-3 bg-[#f8fafc] border border-[#e5edf5] rounded-2xl min-h-[72px] max-h-[110px] overflow-y-auto">
                  {formData.recipients.length === 0 ? (
                    <span className="text-xs text-[#8aa6bf] italic m-auto">
                      No recipients added yet. Search users above to assign.
                    </span>
                  ) : (
                    formData.recipients.map((rec) => (
                      <span
                        key={rec.email}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#d2e4f7] rounded-lg text-xs text-[#0b2138] shadow-2xs"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#2f8fe0]" />
                        <span className="font-semibold">{rec.name || rec.email}</span>
                        <span className="text-[10px] text-[#5c7f9f]">({rec.email})</span>
                        <button
                          type="button"
                          onClick={() => removeRecipient(rec.email)}
                          className="text-[#8aa6bf] hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Email Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0b2138] block">
                  Email Subject <span className="text-[#8aa6bf] font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="Subject (optional)"
                  value={formData.email_subject}
                  onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                  className="h-10 text-xs border-[#dce6f1] rounded-xl focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                />
              </div>

              {/* Custom Email Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0b2138] block">
                  Custom Note <span className="text-[#8aa6bf] font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder="Message note (optional)"
                  value={formData.email_body}
                  onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
                  rows={3}
                  className="text-xs border-[#dce6f1] rounded-xl resize-none focus-visible:ring-1 focus-visible:ring-[#2f8fe0]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-[#e5edf5] flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="h-10 text-xs border-[#dce6f1] rounded-xl cursor-pointer px-5 w-full sm:w-auto"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                onClick={handleSaveSchedule}
                disabled={isSubmitting}
                className="h-10 px-6 text-xs font-semibold bg-[#0b2138] hover:bg-[#163e6b] text-white rounded-xl cursor-pointer flex items-center gap-2 shadow-xs transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingScheduleId ? "Update Schedule" : "Save Schedule"}</span>
                )}
              </Button>
            </div>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
