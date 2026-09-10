import { Report } from "@/entities/report.entity";
import { Workspace } from "@/entities/workspace.entity";
import "reflect-metadata";
import { DataSource } from "typeorm";

const AppDWDataSource = new DataSource({
  type: "postgres",
  host: process.env.DW_HOST,
  port: Number(process.env.DW_PORT),
  username: process.env.DW_USER,
  password: process.env.DW_PASSWORD,
  database: process.env.DW_NAME,
  synchronize: false, // disable in production
  logging: false,
});

// Initialize connection
export const initializeDW_DB = async () => {
  try {
    if (!AppDWDataSource.isInitialized) {
        await AppDWDataSource.initialize();
        console.log("✅ Datawarehouse connected!");
      }

  } catch (error) {
    console.error("Database connection failed", error);
    throw error;
  }
};

export default AppDWDataSource;