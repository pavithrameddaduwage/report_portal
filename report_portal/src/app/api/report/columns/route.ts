

import { NextRequest, NextResponse } from "next/server";


import { Report } from "@/entities/report.entity";
import { EntityManager } from "typeorm";
import AppDWDataSource, { initializeDW_DB } from "@/lib/database-dw";
import AppDataSource, { initializeDB } from "@/lib/database";

export async function POST(req: NextRequest) {
    await initializeDW_DB();
  const entityManager: EntityManager = AppDWDataSource.manager;

  try {
    const body = await req?.json();
    const {
      view,
      schema
    } = body;
    console.log("POST request called",view,schema)
    if (!view || !schema) {
      return NextResponse.json({ message: "Schema and view parameters are required" }, { status: 400 });
    }

    const columnQuery = `
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = $2
  `;

  const columns = (await entityManager.query(columnQuery, [schema, view])).map((row: any) => row.column_name);
  
  return NextResponse.json({ columns });
  } catch (error) {
    
  }


}


