import { Body, Controller, Post, Res } from '@nestjs/common';
import { DatawarehouseService } from './datawarehouse.service';
import { Response } from 'express';

@Controller('datawarehouse')
export class DatawarehouseController {
  constructor(private readonly datawarehouseService: DatawarehouseService) {}


  @Post('getReportByParameters')
  getReportByParameters(@Body() data:{view:string,schema:string,page:number,pageSize:number,sortField?:string,displaycolumns:string[],sortOrder:string,filter:string,columnfilter:any,download:boolean,reportid:number,display_view:number}){
    return this.datawarehouseService.getReportByParameters(data)
  }

  @Post('downloadReport')
  async downloadReport(@Body() data:{view:string,schema:string,page:number,pageSize:number,sortField?:string,displaycolumns:string[],sortOrder:string,filter:string,columnfilter:any,filename:string,reportid:number,display_view:number},@Res() res:Response){
     const excelBufferStream = await this.datawarehouseService.downloadReport(data);

    // response.setHeader(
    //   'Content-Type',
    //   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    // );
    // response.setHeader(
    //   'Content-Disposition',
    //   'attachment; filename=' + data.filename
    // );

    // return response.send(excelBuffer);




    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');

    // const stream = generateExcelStream(columns, rows, displaycolumns);
    excelBufferStream.pipe(res); 
  }


  @Post('getColumnListBySchemaAndView')
  getColumnListBySchemaAndView(@Body() data:{schema:string, view:string}){
    return this.datawarehouseService.getColumnListBySchemaAndView(data)
  }

  @Post('getItemsforDropdown')
  getItemsforDropdown(@Body() data:{schema:string,view:string,column:string}){
    return this.datawarehouseService.getItemsforDropdown(data)
  }
  }



