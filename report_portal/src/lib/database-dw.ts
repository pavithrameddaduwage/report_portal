import { Report } from "@/entities/report.entity";
import { Workspace } from "@/entities/workspace.entity";
import "reflect-metadata";
import { DataSource } from "typeorm";

const AppDWDataSource = new DataSource({
  type: "postgres",
  host: process.env.DW_HOST || '10.15.1.37',
  port: Number(process.env.DW_PORT) || 7102,
  username: process.env.DW_USER || 'hgbi_view',
  password: process.env.DW_PASSWORD || 'hgbi_view',
  database: process.env.DW_NAME || 'postgres',
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