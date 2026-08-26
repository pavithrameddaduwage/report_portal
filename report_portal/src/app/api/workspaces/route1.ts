import type { NextApiRequest, NextApiResponse } from "next";
import AppDataSource, { initializeDB } from "@/lib/database";
import { Workspace } from "@/entities/workspace.entity";
import { NextRequest, NextResponse } from "next/server";


export async function GET() {
    await initializeDB();
    const workspaceRepo = AppDataSource.getRepository(Workspace);
    const workspaces = await workspaceRepo.find({relations:['reports']});
    return NextResponse.json(workspaces, { status: 200 });
  }
  
  export async function POST(req: NextRequest) {
    await initializeDB();
    const { name, description } = await req.json();
  
    if (!name || !description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
  
    const workspaceRepo = AppDataSource.getRepository(Workspace);
    const newWorkspace = workspaceRepo.create({ name, description });
    await workspaceRepo.save(newWorkspace);
  
    return NextResponse.json(newWorkspace, { status: 201 });
  }

