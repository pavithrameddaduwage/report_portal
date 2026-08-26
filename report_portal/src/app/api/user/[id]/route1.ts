import { NextRequest, NextResponse } from "next/server";
import AppDataSource, { initializeDB } from "@/lib/database";
import { User } from "@/entities/user.entity";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  const {id:userId} =await params;

  await initializeDB();

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: { id: parseInt(userId, 10) },
    relations: ["workspaces", "reports"],
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user, { status: 200 });
}
