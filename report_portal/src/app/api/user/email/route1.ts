import { NextRequest, NextResponse } from "next/server";
import AppDataSource, { initializeDB } from "@/lib/database";
import { User } from "@/entities/user.entity";

export async function POST(
  req: NextRequest,
  // {
  //   params,
  // }: {
  //   params: Promise<{ email: string }>
  // }
) {
  // const { email } =await params;

  const { email } = await req.json();
  console.log("Email",email)

  await initializeDB();

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: { email },
    relations: ["workspaces", "reports"],
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user, { status: 200 });
}
