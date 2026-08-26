import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LogService } from './log.service';
import { CreateLogDto } from './dto/create-log.dto';


@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post('create')
  create(@Body() createLogDto: any) {
    return this.logService.create(createLogDto);
  }

  @Get()
  findAll() {
    return this.logService.findAll();
  }


}
