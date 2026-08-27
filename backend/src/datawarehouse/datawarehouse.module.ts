import { Module } from '@nestjs/common';
import { DatawarehouseService } from './datawarehouse.service';
import { DatawarehouseController } from './datawarehouse.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportColumns } from 'src/report/entities/report-columns.entity';
import { DisplayViewColumns } from 'src/report/entities/displayview-columns.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportColumns, DisplayViewColumns])],
  controllers: [DatawarehouseController],
  providers: [DatawarehouseService],
  exports: [DatawarehouseService],
})
export class DatawarehouseModule {}

