import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ReportService } from './report.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Public()
  @Get('findAllReports')
  findAllReports(){
    return this.reportService.findAllReports()
  }

  @Public()
  @Get('findReportsByWorkspaceId/:workspaceid')
  findReportsByWorkspaceId(@Param('workspaceid') workspaceid:number){
    return this.reportService.findReportsByWorkspaceId(workspaceid)
  }

  @Public()
  @Post('createReport')
  createReport(@Body() data){
    return this.reportService.createReport(data)
  }

  @Public()
  @Delete('deleteReport/:id')
  deleteReport(@Param('id') id:number){
    return this.reportService.deleteReport(+id)
  }

  @Public()
  @Post('createDisplayView')
  createDisplayView(@Body() data:any){
    return this.reportService.createDisplayView(data)
  }

  @Public()
  @Get('findAllDisplayViews')
  findAllDisplayViews(){
    return this.reportService.findAllDisplayViews()
  }

  @Public()
  @Get('findDisplayViewByReportId/:id')
  findDisplayViewByReportId(@Param('id') id: number){
    return this.reportService.findDisplayViewByReportId(id)
  }

  @Public()
  @Delete('deleteDisplayView/:id')
  deleteDisplayView(@Param('id') id: number) {
    return this.reportService.deleteDisplayView(+id);
  }
}
