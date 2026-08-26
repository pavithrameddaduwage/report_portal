// import * as ExcelJS from 'exceljs';

// // import { Injectable, BadRequestException } from '@nestjs/common';
// // import * as xlsx from 'xlsx';

// // export type OutputType = 'object' | 'array';

// // @Injectable()
// // export class ExcelService {

// //   readExcelFileFromBlobSync(fileBlob: Buffer | ArrayBuffer, outputType: OutputType): any {
// //     try {

// //       const workbook = xlsx.read(fileBlob, { type: 'buffer' });

// //       const firstSheetName = workbook.SheetNames[0];
// //       const worksheet = workbook.Sheets[firstSheetName];


// //       if (outputType === 'object') {
// //         return xlsx.utils.sheet_to_json(worksheet); // Array of objects
// //       } else if (outputType === 'array') {
// //         return xlsx.utils.sheet_to_csv(worksheet)
// //           .split('\n') // Split rows by newline
// //           .map((row) => row.split(',')); // Split columns by comma
// //       } else {
// //         throw new BadRequestException('Invalid output type. Use "object" or "array".');
// //       }
// //     } catch (error) {
// //       throw new BadRequestException('Failed to read the Excel file synchronously. ' + error.message);
// //     }
// //   }
// // }

// export async function generateExcel(columns: string[], rows: any[],displaycolumns:any[]): Promise<Buffer> {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Report");
  
//     // Define column headers dynamically
//     worksheet.columns = displaycolumns.map((col) => ({
//       header: col.displayName,
//       key: col.column,
//       width: col.column.length + 2, // Initial minimum width
//     }));
  
//     // Style headers
//     const headerRow = worksheet.getRow(1);
//     headerRow.eachCell((cell) => {
//       cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
//       cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } }; // Blue background
//       cell.alignment = { horizontal: "center", vertical: "middle" };
//     });
  
//     // Add rows dynamically
//     rows.forEach((row) => worksheet.addRow(row));
  
//     // **Auto-adjust column widths based on actual content**
//     worksheet.columns.forEach((column:any) => {
//       let maxLength = 0;
//       column["eachCell"]({ includeEmpty: true }, (cell:any) => {
//           const columnLength = cell.value ? cell.value.toString().length + 3 : 10;
//           if (cell.type === ExcelJS.ValueType.Date) {
//               maxLength = 20;
//           }
//           else if (columnLength > maxLength) {
//               maxLength = columnLength + 3;
//           }

//           cell.border = {
//             top: { style: "thin" },
//             left: { style: "thin" },
//             bottom: { style: "thin" },
//             right: { style: "thin" },
//           };
//       });

//       column.width = maxLength < 10 ? 10 : maxLength;
//   });
  

  
//     // Generate Excel buffer as a Node.js Buffer
//     const buffer = await workbook.xlsx.writeBuffer();
//     return Buffer.from(buffer); // Ensure it's a Buffer, not Uint8Array
//   }

import * as ExcelJS from 'exceljs';
import { PassThrough } from 'stream';

export function generateExcelStream(columns: string[], rows: any[], displaycolumns: any[]) {
  const stream = new PassThrough();

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream });
  const worksheet = workbook.addWorksheet('Report');

  worksheet.columns = displaycolumns.map((col) => ({
    header: col.displayName,
    key: col.column,
    width: col.column.length + 2,
  }));

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  headerRow.commit();

  for (const row of rows) {
    worksheet.addRow(row).commit();
  }

  workbook.commit(); // trigger flush

  return stream;
}
