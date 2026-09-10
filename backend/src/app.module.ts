import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InjectDataSource, TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { WorkspaceModule } from './workspace/workspace.module';
import { ReportModule } from './report/report.module';
import { UsersModule } from './users/users.module';
import { DatawarehouseModule } from './datawarehouse/datawarehouse.module';
import { AuthModule } from './auth/auth.module';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot({
      name: 'default',
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forRoot({
      name: 'datawarehouse',
      type: 'postgres',
      host: process.env.DW_HOST,
      port: Number(process.env.DW_PORT),
      username: process.env.DW_USER,
      password: process.env.DW_PASSWORD,
      database: process.env.DW_NAME,
      synchronize: false,
      retryAttempts: 2,
      retryDelay: 2000,
    }),

    WorkspaceModule,
    ReportModule,
    UsersModule,
    DatawarehouseModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(
    @InjectDataSource('default') private readonly defaultDataSource: DataSource,
    @InjectDataSource('datawarehouse') private readonly dwDataSource: DataSource,
  ) { }

  async onModuleInit() {
    if (this.defaultDataSource.isInitialized) {
      console.log(`✅ Connected to PostgreSQL Database (${process.env.DB_NAME || 'default'})`);
    }
    if (this.dwDataSource.isInitialized) {
      console.log(`✅ Connected to Datawarehouse Database (${process.env.DW_NAME || 'dw'})`);
    }
  }
}

