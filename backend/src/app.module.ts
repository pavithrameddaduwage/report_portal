import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { WorkspaceModule } from './workspace/workspace.module';
import { ReportModule } from './report/report.module';
import { UsersModule } from './users/users.module';
import { DatawarehouseModule } from './datawarehouse/datawarehouse.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot({
      name: 'default',
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'Belpostgre123',
      database: process.env.DB_NAME || 'report_portal_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forRoot({
      name: 'datawarehouse',
      type: 'postgres',
      host: process.env.DW_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DW_PORT || process.env.DB_PORT || '5432', 10),
      username: process.env.DW_USER || process.env.DB_USER || 'postgres',
      password: process.env.DW_PASSWORD || process.env.DB_PASSWORD || 'Belpostgre123',
      database: process.env.DW_NAME || process.env.DB_NAME || 'report_portal_db',
      synchronize: false,
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
export class AppModule {}
