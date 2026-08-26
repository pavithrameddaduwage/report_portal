// import { NextRequest, NextResponse } from "next/server";
// import  AppDWDataSource, { initializeDW_DB }  from "@/lib/database-dw"; // Ensure this is correctly set up
// import { parse } from "json2csv";
// import { EntityManager } from "typeorm";
// import { generateExcel } from "@/lib/utils";

// export async function GET(req: NextRequest) {
//   const url = new URL(req.url);
//   const view = url.searchParams.get("view");
//   const schema = url.searchParams.get("schema");
//   const page = Number(url.searchParams.get("page") || "1");
//   const pageSize = Number(url.searchParams.get("pageSize") || "10");
//   const sortField = url.searchParams.get("sortField") || "";
//   const sortOrder = url.searchParams.get("sortOrder") || "asc";
//   const filter = url.searchParams.get("filter") || "";
//   const columnfilter=url.searchParams.get("columnfilter") || ""
//   const isDownload = url.searchParams.get("download") === "true";

//   if (!view || !schema) {
//     return NextResponse.json({ message: "Schema and view parameters are required" }, { status: 400 });
//   }

//   try {
//       await initializeDW_DB();// Ensure DB connection is ready
//     const entityManager: EntityManager = AppDWDataSource.manager;

//     // Fetch column names dynamically
//     const columnQuery = `
//       SELECT column_name FROM information_schema.columns
//       WHERE table_schema = $1 AND table_name = $2
//     `;
//     const columns = (await entityManager.query(columnQuery, [schema, view])).map((row:any) => row.column_name);

//     if (isDownload) {

//         let query = `SELECT * FROM ${schema}.${view}`
//         const rows = await entityManager.query(query);

//         const excelBuffer = await generateExcel(columns, rows);

//         return new NextResponse(excelBuffer, {
//           headers: {
//             "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//             "Content-Disposition": `attachment; filename=report.xlsx`,
//           },
//         });
//       }

//     // Construct dynamic query for filtering, sorting, and pagination
//     let query = `SELECT * FROM ${schema}.${view}`;
//     const queryParams: any[] = [];

//     if (filter) {
//         query += ' WHERE FALSE'
//       columns.forEach((column:any) => {
//         query += ` OR ${column}::text ILIKE $${queryParams.length + 1}`;
//         queryParams.push(`%${filter}%`);
//       });
//     }

//     // Object.entries(columnfilter).forEach(([key, value]) => {
//     //     console.log(`${key}: ${value}`);
//     //   });
//     console.log("columnfilter",columnfilter);

//     console.log("query",query)

//     if (sortField && columns.includes(sortField)) {
//       query += ` ORDER BY ${sortField} ${sortOrder}`;
//     }

//     query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
//     queryParams.push(pageSize, (page - 1) * pageSize);

//     const rows = await entityManager.query(query, queryParams);

//     // Get total row count
//     const rowCountQuery = `SELECT count(*) AS count FROM ${schema}.${view} WHERE TRUE`;
//     const rowCountResult = await entityManager.query(rowCountQuery);
//     const rowCount = rowCountResult[0]?.count || 0;

//     // Handle CSV Download
//     // if (isDownload) {
//     //   const csv = parse(rows);
//     //   return new NextResponse(csv, {
//     //     headers: {
//     //       "Content-Type": "text/csv",
//     //       "Content-Disposition": "attachment; filename=report.csv",
//     //     },
//     //   });
//     // }

//     return NextResponse.json({ data: rows, columns, totalRecords: rows.length, rowCount });
//   } catch (error) {
//     console.error("Database error:", error);
//     return NextResponse.json({ message: "Error fetching data" }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { EntityManager } from "typeorm";
import AppDWDataSource, { initializeDW_DB } from "@/lib/database-dw"; // Ensure DB imports are correct
import { generateExcel } from "@/lib/utils"; // Ensure utility imports
import AppDataSource, { initializeDB } from "@/lib/database";
import { Report } from "@/entities/report.entity";
import { Workspace } from "@/entities/workspace.entity";

export async function POST(req: NextRequest) {

  try {
    const body = await req?.json(); // Parse JSON body

    const {
      view,
      schema,
      page = 1,
      pageSize = 10,
      sortField = "",
      displaycolumns = [],
      sortOrder = "asc",
      filter = "",
      columnfilter = {},
      download = false,
    } = body;



    if (!view || !schema) {
      return NextResponse.json(
        { message: "Schema and view parameters are required" },
        { status: 400 }
      );
    }

    await initializeDW_DB(); // Ensure DB connection is ready
    const entityManager: EntityManager = AppDWDataSource.manager;

    // Fetch column names dynamically
    const columnQuery = `
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
    `;
    const columns = (
      await entityManager.query(columnQuery, [schema, view])
    ).map((row: any) => row.column_name);

    // Construct query dynamically for filtering, sorting, and pagination
    let query = `SELECT * FROM ${schema}.${view}`;
    const queryParams: any[] = [];

    // if (filter) {
    //   query += " WHERE FALSE";
    //   columns.forEach((column: any) => {
    //     query += ` OR ${column}::text ILIKE $${queryParams.length + 1}`;
    //     queryParams.push(`%${filter}%`);
    //   });
    // }
    console.log("displaycolumns1",displaycolumns)
    // Handle column filtering
    if (columnfilter && typeof columnfilter === "object") {
      // Fetch column data types dynamically
      const columnTypeQuery = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2
        `;

      const columnTypes = await entityManager.query(columnTypeQuery, [
        schema,
        view,
      ]);
      const columnTypeMap: Record<string, string> = {};

      columnTypes.forEach((col: { column_name: string; data_type: string }) => {
        columnTypeMap[col.column_name] = col.data_type;
      });
      console.log("displaycolumns2",displaycolumns)
      // Now build the WHERE clause
      Object.entries(columnfilter).forEach(([key, value]) => {
        if (columns.includes(key)) {
          const columnType = columnTypeMap[key] || ""; // Get SQL column type

          if (
            [
              "integer",
              "numeric",
              "bigint",
              "real",
              "double precision",
            ].includes(columnType) &&
            (value === "" || value === null || isNaN(Number(value)))
          ) {
            return; // Ignore empty numeric values
          }

          query += query.includes("WHERE") ? " AND" : " WHERE";

          if (["character varying", "text"].includes(columnType)) {
            query += ` ${key} ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${value}%`); // Wildcard search for text
          } else {
            query += ` ${key} = $${queryParams.length + 1}`;
            queryParams.push(value); // Exact match for numeric fields
          }
        }
      });
    }

    console.log("query: ", query);

    // Apply sorting
    if (sortField && columns.includes(sortField)) {
      query += ` ORDER BY ${sortField} ${sortOrder}`;
    }


  
    if (download) {
      console.log("downloading.............");
      // const query = `SELECT * FROM ${schema}.${view}`;

    //   console.log("downloading query", query);
     
      const rows = await entityManager.query(query, queryParams);



 
      const excelBuffer = await generateExcel(columns, rows,displaycolumns);
      console.log("excelBuffer done.....");
      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=report.xlsx`,
        },
      });
    }

    // Apply pagination
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${
      queryParams.length + 2
    }`;
    queryParams.push(pageSize, (page - 1) * pageSize);

    const rows = await entityManager.query(query, queryParams);

    // Get total row count
    const rowCountQuery = `SELECT count(*) AS count FROM ${schema}.${view}`;
    const rowCountResult = await entityManager.query(rowCountQuery);
    const rowCount = rowCountResult[0]?.count || 0;

    return NextResponse.json({
      data: rows,
      columns,
      totalRecords: rows.length,
      rowCount,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { message: "Error fetching data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await initializeDB();
  const entityManager: EntityManager = AppDataSource.manager;

  try {
    const reportRepository = AppDataSource.getRepository(Report);

    const reports = await reportRepository.find({
      relations: ["workspace"], // Fetch related workspace
    });

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching data" },
      { status: 500 }
    );
  }
}
