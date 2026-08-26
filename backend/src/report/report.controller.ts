import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('findAllReports')
  findAllReports(){
    return this.reportService.findAllReports()
  }

@Get('findReportsByWorkspaceId/:workspaceid')
  findReportsByWorkspaceId(@Param('workspaceid') workspaceid:number){
    return this.reportService.findReportsByWorkspaceId(workspaceid)
  }


  @Post('createReport')
  createReport(@Body() data){
    return this.reportService.createReport(data)
  }

  @Delete('deleteReport/:id')
  deleteReport(@Param('id') id:number){
    return this.reportService.deleteReport(+id)
  }

  @Post('createDisplayView')
  createDisplayView(@Body() data:any){
    return this.reportService.createDisplayView(data)
  }

  @Get('findAllDisplayViews')
  findAllDisplayViews(){
    return this.reportService.findAllDisplayViews()
  }

  @Get('findDisplayViewByReportId/:id')
  findDisplayViewByReportId(@Param('id') id: number){
    return this.reportService.findDisplayViewByReportId(id)
  }
}
