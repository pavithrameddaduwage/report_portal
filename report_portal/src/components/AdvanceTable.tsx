"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Loader2, LucideLoader } from "lucide-react";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  getReportByParameters,
} from "@/services/datawarehouse-service";
import { downloadCSV } from "@/lib/utils";
import FilterRow from "@/app/workspaces/[id]/(components)/filterrow";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";

interface ReportData {
  data: Record<string, any>[];
  columns: string[];
  totalRecords: number;
  rowCount: number;
}

const fetchReportData = async (
  view: string,
  schema: string,
  page: number,
  pageSize: number,
  columnfilter: any,
  displaycolumns: [],
  reportid: number,
  display_view: number,
  sortField?: string,
  sortOrder: "asc" | "desc" = "asc",
  filter?: string
) => {
  const response: any = await getReportByParameters({
    page,
    pageSize,
    view,
    schema,
    sortOrder,
    columnfilter,
    displaycolumns,
    reportid,
    display_view: display_view || 0,
    sortField,
    filter,
    download: false,
  });

  if (response.status === 201 || response.status === 200) {
    return response.data;
  } else {
    throw new Error("Report loading failure");
  }
};

// Render cell values with special dot-pill styling for status
const renderCellContent = (columnName: string, val: any) => {
  if (val === null || val === undefined || val === "") return "—";
  const str = String(val);

  if (columnName.toLowerCase() === "status" || str.toLowerCase() === "active" || str.toLowerCase() === "pending") {
    if (str.toLowerCase() === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 bg-[#e7f7ee] text-[#178a4c] font-bold text-[12px] px-2.5 py-0.5 rounded-full border border-[#b2e5c8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#178a4c]"></span>
          <span>Active</span>
        </span>
      );
    }
    if (str.toLowerCase() === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 bg-[#fdf1de] text-[#b9700a] font-bold text-[12px] px-2.5 py-0.5 rounded-full border border-[#f8dab0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#b9700a]"></span>
          <span>Pending</span>
        </span>
      );
    }
  }

  return str;
};

const AdvancedTable = ({
  view,
  schema,
  displaycolumns,
  reportname,
  reportid,
  allowed_displayviews,
}: {
  view: string;
  schema: string;
  displaycolumns: any;
  reportname: string;
  reportid: number;
  allowed_displayviews: any;
}) => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("");
  const [columnfilter, setColumnFilter] = useState<any>({});
  const [isdownloading, setIsDownloading] = useState(false);
  const [displayViews, setDisplayViews] = useState<any>([]);
  const [selecteddisplayview, setSelectedDisplayView] = useState<number>(0);
  const [resetTrigger, setResetTrigger] = useState(false);

  useEffect(() => {
    setDisplayViews(allowed_displayviews?.displayViews || []);
  }, [allowed_displayviews]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<ReportData, Error>({
    queryKey: [
      "report",
      {
        view,
        schema,
        page,
        pageSize,
        columnfilter,
        displaycolumns,
        reportid,
        sortField,
        sortOrder,
        filter,
        selecteddisplayview,
      },
    ],
    queryFn: async () => {
      const resData: any = await fetchReportData(
        view,
        schema,
        page,
        pageSize,
        columnfilter,
        displaycolumns,
        reportid,
        selecteddisplayview || 0,
        sortField,
        sortOrder,
        filter
      );

      let datacolumns: any[] = [];
      (resData.columns || []).forEach((col: any) => {
        const colName = typeof col === "string" ? col : col.column;
        const displaycolumn = (displaycolumns || []).find((f: any) => f.column === colName);
        let displayname = displaycolumn && displaycolumn.displayName ? displaycolumn.displayName : colName;
        datacolumns.push({
          column: colName,
          displayName: displayname,
          filter_type: typeof col === "object" ? col.filter_type : displaycolumn?.filter_type,
        });
      });
      resData.columns = datacolumns;
      return resData;
    },
    staleTime: 60 * 1000,
    placeholderData: (prevData) => prevData,
  });

  const handleSort = useCallback((field: string) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
      } else {
        setSortOrder("asc");
      }
      return field;
    });
    setPage(1);
  }, []);

  const handleFilterChange = (filters: Record<string, any>) => {
    setColumnFilter(filters);
    setPage(1);
  };

  const handleApplyChanges = () => {
    refetch();
    toast.success("Applied changes");
  };

  const handleDownloadCSV = async () => {
    try {
      setIsDownloading(true);
      const response: any = await getReportByParameters({
        page: 1,
        pageSize: 10000,
        view,
        schema,
        sortOrder,
        columnfilter,
        displaycolumns,
        reportid,
        display_view: selecteddisplayview || 0,
        sortField,
        filter,
        download: true,
      });

      const exportRows = response.data?.data || data?.data || [];
      const exportCols = (data?.columns && data.columns.length > 0)
        ? data.columns
        : displaycolumns;

      downloadCSV(exportCols, exportRows, (reportname || "report") + ".csv");
      toast.success("CSV downloaded");
      setIsDownloading(false);
    } catch (err) {
      console.error("CSV download error:", err);
      if (data?.data && data.data.length > 0) {
        downloadCSV(data.columns, data.data, (reportname || "report") + ".csv");
        toast.success("CSV downloaded");
      } else {
        toast.error("Download failed");
      }
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Controls Bar: Display View on Left, Action Buttons on Right */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#0a1c30]">Display View</span>
          <Select
            value={selecteddisplayview ? selecteddisplayview.toString() : ""}
            onValueChange={(e: any) => {
              setSelectedDisplayView(Number(e));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs min-w-36 bg-white border border-[#dce6f1] text-[#0f2b48] rounded-md shadow-2xs">
              <SelectValue placeholder="Default View" />
            </SelectTrigger>
            <SelectContent className="text-xs border-[#dce6f1]">
              <SelectGroup>
                <SelectItem value="0">Default View</SelectItem>
                {displayViews?.map((dv: any) => (
                  <SelectItem key={dv.value} value={dv.value.toString()}>
                    {dv.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleApplyChanges}
            className="h-8 px-3.5 bg-[#0e2947] hover:bg-[#163e6b] text-white text-xs font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            Apply changes
          </Button>

          <Button
            onClick={handleDownloadCSV}
            disabled={isdownloading}
            className="h-8 px-4 bg-[#0e2947] hover:bg-[#163e6b] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {isdownloading ? (
              <Loader2 className="animate-spin w-3.5 h-3.5" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download CSV</span>
          </Button>
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && <p className="text-xs text-[#335375] mb-2">Loading data...</p>}
      {error && (
        <p className="text-[#d33a3a] text-xs mb-2">Error loading data. Please try again.</p>
      )}

      {/* Table Container Card */}
      <div className="bg-white rounded-xl border border-[#dce6f1] shadow-sm overflow-hidden relative min-h-48">
        {isFetching && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
            <LucideLoader className="animate-spin text-[#2f8fe0] w-6 h-6" />
          </div>
        )}

        {data && data.columns && data.columns.length > 0 ? (
          <Table className={isFetching ? "opacity-50" : ""}>
            <TableHeader className="bg-[#edf4fa]">
              <TableRow className="border-[#dce6f1]">
                {data.columns.map((column: any, index: number) => (
                  <TableHead
                    key={index}
                    className="cursor-pointer text-[13px] font-bold text-[#0a1c30] py-3 px-3.5 select-none hover:bg-[#e4eff8] transition-colors"
                    onClick={() => handleSort(column.column)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{column.displayName}</span>
                      {sortField === column.column ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-[#2f8fe0]" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-[#2f8fe0]" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-[#8aa6bf]" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>

              {/* Filter inputs row underneath column headers */}
              <FilterRow
                schema={schema}
                view={view}
                filters={data.columns}
                onFilterChange={handleFilterChange}
                reset={resetTrigger}
              />
            </TableHeader>
            <TableBody className="bg-white">
              {data.data && data.data.length > 0 ? (
                data.data.map((row: any, idx: number) => (
                  <TableRow key={idx} className="border-b border-[#edf3f9] hover:bg-[#f6fafc] transition-colors">
                    {data.columns.map((column: any) => (
                      <TableCell key={column.column} className="text-[13px] text-[#0f2b48] py-2.5 px-3.5 font-normal">
                        {renderCellContent(column.column, row[column.column])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={data.columns.length} className="text-center py-10 text-xs text-[#5c7f9f]">
                    No matching records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center text-xs text-[#5c7f9f]">
            No report data available
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.data && data.data.length > 0 && (
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-[#335375]">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="h-7 text-xs font-semibold text-[#0a1c30] hover:bg-white hover:border hover:border-[#dce6f1]"
          >
            <ChevronLeft size={14} className="mr-1" /> Previous
          </Button>

          <span className="font-bold text-[#0a1c30] text-xs">
            Page {page}
          </span>

          <Button
            variant="ghost"
            size="sm"
            disabled={data.data.length < pageSize}
            onClick={() => setPage((prev) => prev + 1)}
            className="h-7 text-xs font-semibold text-[#0a1c30] hover:bg-white hover:border hover:border-[#dce6f1]"
          >
            Next <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdvancedTable;
