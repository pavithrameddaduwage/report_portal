import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Public()
  @Post('cleanupDummyData')
  cleanupDummyData() {
    return this.workspaceService.cleanupDummyData();
  }


  @Public()
  @Get('findAllWorkspaces')
  findAllWorkspaces(){
    return this.workspaceService.findAllWorkspaces()
  }


  @Public()
  @Get('findWorkspaceById/:id')
  findWorkspaceById(@Param('id') id:number){
    console.log("id",id)
    return this.workspaceService.findWorkspaceById(+id)
  }

  @Public()
  @Post('createWorkspace')
  createWorkspace(@Body() data:any){
    console.log("data",data)
    return this.workspaceService.createWorkspace(data)
  }

  @Public()
  @Delete('deleteWorkspace/:id')
  deleteWorkspace(@Param('id') id:number){
    console.log("id",id)
    return this.workspaceService.deleteWorkspace(+id)
  }


}
