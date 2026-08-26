import { NextResponse } from "next/server";
import AppDataSource, { initializeDB } from "@/lib/database";
import { Workspace } from "@/entities/workspace.entity";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await params;

  await initializeDB();

  const workspaceRepo = AppDataSource.getRepository(Workspace);
  const workspace = await workspaceRepo.findOne({
    where: { id: Number(id) },
    relations: ["reports"],
  });

  return workspace
    ? NextResponse.json(workspace, { status: 200 })
    : NextResponse.json({ error: "Not Found" }, { status: 404 });
}
