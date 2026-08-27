import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('api/scheduler')
export class SchedulerController {

  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('schedules')
  findAllSchedules() {
    return this.schedulerService.findAllSchedules();
  }

  @Get('schedules/:id')
  findOneSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.schedulerService.findOneSchedule(id);
  }

  @Post('createSchedule')
  createSchedule(@Body() data: any) {
    return this.schedulerService.createSchedule(data);
  }

  @Put('updateSchedule/:id')
  updateSchedule(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.schedulerService.updateSchedule(id, data);
  }

  @Delete('deleteSchedule/:id')
  deleteSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.schedulerService.deleteSchedule(id);
  }

  @Post('toggleActive/:id')
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.schedulerService.toggleActive(id);
  }

  @Post('runNow/:id')
  runNow(@Param('id', ParseIntPipe) id: number) {
    return this.schedulerService.executeSchedule(id, 'MANUAL');
  }

  @Get('logs')
  findAllLogs() {
    return this.schedulerService.findAllLogs();
  }

  @Get('stats')
  getStats() {
    return this.schedulerService.getStats();
  }
}
