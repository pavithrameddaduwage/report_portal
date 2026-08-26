
import AppDataSource, { initializeDB } from "@/lib/database";
import { Workspace } from "@/entities/workspace.entity";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/entities/user.entity";
import {Report} from "@/entities/report.entity"


export async function GET() {
    await initializeDB();
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find();
    return NextResponse.json(users, { status: 200 });
  }

  export async function POST(req: NextRequest) {
    await initializeDB();
    const { email, name,workspaceIds,reportIds } = await req.json();
  
    if (!name || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
  
    const userRepository = AppDataSource.getRepository(User);
  
    try {
      // 🔹 Check if user with same email exists
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 } // 409 Conflict status code
        );
      }
      let workspaces:Workspace[]=[]

      workspaceIds.forEach((f:any)=>{
        workspaces.push({id:f} as Workspace)
      })


      let reports:Report[]=[]

      reportIds.forEach((f:any)=>{
        reports.push({id:f} as Report)
      })


      // 🔹 Create new user
      const newUser = userRepository.create({ email, name,workspaces,reports });
      await userRepository.save(newUser);
  
      return NextResponse.json(newUser, { status: 201 });
  
    } catch (error: any) {
      console.error("Database Error: ", error);
  
      // 🔹 Handle unique constraint violation (PostgreSQL, MySQL, etc.)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Email must be unique" },
          { status: 409 }
        );
      }
  
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 }
      );
    }
  }
  