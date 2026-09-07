import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('findAllUsers')
  findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Public()
  @Post('findUserByEmail')
  findUserByEmail(@Body() data: { email: any }) {
    return this.usersService.findUserByEmail(data.email);
  }

  @Public()
  @Post('createUser')
  createUser(@Body() data: any) {
    return this.usersService.createUser(data);
  }

  @Public()
  @Delete('deleteUser/:id')
  deleteUser(@Param('id') id: number) {
    return this.usersService.deleteUser(id);
  }

  @Public()
  @Post('bulk-access')
  bulkAllocateUsers(@Body() data: { userIds: number[]; workspaceIds: number[]; reportIds: number[]; displayviewIds: number[] }) {
    return this.usersService.bulkAllocateUsers(data);
  }

  @Public()
  @Get('findAllRoles')
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Public()
  @Post('createRole')
  createRole(@Body() data: { id?: number; role: string }) {
    return this.usersService.createRole(data);
  }

  @Public()
  @Delete('deleteRole/:id')
  deleteRole(@Param('id') id: number) {
    return this.usersService.deleteRole(id);
  }
}
