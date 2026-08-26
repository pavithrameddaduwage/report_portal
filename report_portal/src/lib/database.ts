import { ReportColumns } from "@/entities/report-columns.entity";
import { Report } from "@/entities/report.entity";
import { User } from "@/entities/user.entity";
import { Workspace } from "@/entities/workspace.entity";
import "reflect-metadata";
import { DataSource } from "typeorm";

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // disable in production
  logging: false,
  entities:[Workspace,Report,ReportColumns,User],
  migrations: ["src/migrations/**/*.ts"],
});

// Initialize connection
export const initializeDB = async () => {
  try {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log("✅ Database connected!");
      }

  } catch (error) {
    console.error("Database connection failed", error);
    throw error;
  }
};

export default AppDataSource;