import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';


@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get('findAllWorkspaces')
  findAllWorkspaces(){
    return this.workspaceService.findAllWorkspaces()
  }

  @Get('findWorkspaceById/:id')
  findWorkspaceById(@Param('id') id:number){
    console.log("id",id)
    return this.workspaceService.findWorkspaceById(+id)
  }

  @Post('createWorkspace')
  createWorkspace(@Body() data:any){
    console.log("data",data)
    return this.workspaceService.createWorkspace(data)
  }

  @Delete('deleteWorkspace/:id')
  deleteWorkspace(@Param('id') id:number){
    console.log("id",id)
    return this.workspaceService.deleteWorkspace(+id)
  }

}
