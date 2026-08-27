import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportColumns } from './entities/report-columns.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { User } from 'src/users/entities/user.entity';
import { DisplayView } from './entities/displayview.entity';
import { DisplayViewColumns } from './entities/displayview-columns.entity';
import { ReportSchedule } from './entities/report-schedule.entity';
import { ReportScheduleLog } from './entities/report-schedule-log.entity';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { MailService } from '../tools/mail/mail.service';
import { DatawarehouseModule } from '../datawarehouse/datawarehouse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      ReportColumns,
      Workspace,
      User,
      DisplayView,
      DisplayViewColumns,
      ReportSchedule,
      ReportScheduleLog,
    ]),
    DatawarehouseModule,
  ],
  controllers: [ReportController, SchedulerController],
  providers: [ReportService, SchedulerService, MailService],
  exports: [ReportService, SchedulerService, MailService],
})
export class ReportModule {}
