import { Report } from "@/entities/report.entity";
import { Workspace } from "@/entities/workspace.entity";
import "reflect-metadata";
import { DataSource } from "typeorm";

const AppDWDataSource = new DataSource({
  type: "postgres",
  host: '10.15.1.37',
  port: 7102,
  username: 'hgbi_view',
  password: 'hgbi_view',
  database: 'postgres',
  synchronize: false, // disable in production
  logging: false,

});

// Initialize connection
export const initializeDW_DB = async () => {
  try {
    if (!AppDWDataSource.isInitialized) {
        await AppDWDataSource.initialize();
        console.log("✅ Database connected!");
      }

  } catch (error) {
    console.error("Database connection failed", error);
    throw error;
  }
};

export default AppDWDataSource;