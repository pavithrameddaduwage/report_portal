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

@Module({
  imports:[TypeOrmModule.forFeature([Report,ReportColumns,Workspace,User,DisplayView,DisplayViewColumns])],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
