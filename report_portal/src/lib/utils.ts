import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import ExcelJS from "exceljs";
import { Buffer } from "buffer";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadCSV(columns: any[], rows: any[], filename = 'report.csv') {
  if (!rows || rows.length === 0) {
    alert("No data available to download.");
    return;
  }

  const validCols = columns && columns.length > 0
    ? columns
    : Object.keys(rows[0] || {}).map(k => ({ column: k, displayName: k }));

  // Header line
  const headers = validCols
    .map(c => `"${String(c.displayName || c.column).replace(/"/g, '""')}"`)
    .join(',');

  // Data lines
  const dataLines = rows.map(row =>
    validCols.map(col => {
      const val = row[col.column];
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csvContent = "\uFEFF" + [headers, ...dataLines].join('\r\n'); // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function generateExcel(columns: string[], rows: any[], displaycolumns: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");

  worksheet.columns = displaycolumns.map((col) => ({
    header: col.displayName,
    key: col.column,
    width: col.column.length + 2,
  }));

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  rows.forEach((row) => worksheet.addRow(row));

  worksheet.columns.forEach((column: any) => {
    let maxLength = 0;
    column["eachCell"]({ includeEmpty: true }, (cell: any) => {
      const columnLength = cell.value ? cell.value.toString().length + 3 : 10;
      if (cell.type === ExcelJS.ValueType.Date) {
        maxLength = 20;
      } else if (columnLength > maxLength) {
        maxLength = columnLength + 3;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength;
  });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function downloadExcelFromBuffer(buffer: string, filename = 'report.xlsx') {
  try {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    alert('There was an error downloading the Excel file.');
  }
}