

import { NextRequest, NextResponse } from "next/server";

import AppDataSource, { initializeDB } from "@/lib/database";
import { Report } from "@/entities/report.entity";

export async function POST(req: NextRequest) {
  await initializeDB();
  const { id,report_name, report_view,database_schema,workspaceId,columns } = await req.json();

  if (!report_name || !report_view || !database_schema || !workspaceId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const workspaceRepo = AppDataSource.getRepository(Report);
  let output;
  if (id==0){
    const newWorkspace = workspaceRepo.create({ report_name:report_name,report_view:report_view, database_schema:database_schema, workspace:{id:workspaceId},columns:columns});
     output= await workspaceRepo.save(newWorkspace)
  }else{
     output = await workspaceRepo.save({ id:id,report_name:report_name,report_view:report_view, database_schema:database_schema, workspace:{id:workspaceId},columns:columns});

  }
 ;

  return NextResponse.json(output, { status: 201 });
}

