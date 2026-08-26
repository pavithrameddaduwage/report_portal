import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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
    TypeOrmModule.forRoot({
      name: 'default',
      type: 'postgres',
      host: 'localhost',
      username: 'postgres',
      password: 'Belpostgre123',
      // password:'M!SAppsTest',
      database: 'report_portal_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forRoot({
      name: 'datawarehouse',
      type: 'postgres',
      host: 'localhost',
      username: 'postgres',
      password: 'Belpostgre123',
      database: 'report_portal_db',
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
