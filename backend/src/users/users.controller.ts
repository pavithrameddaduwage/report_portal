import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('findAllUsers')
  findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Post('findUserByEmail')
  findUserByEmail(@Body() data: { email: any }) {
    return this.usersService.findUserByEmail(data.email);
  }

  @Post('createUser')
  createUser(@Body() data: any) {
    return this.usersService.createUser(data);
  }

  @Delete('deleteUser/:id')
  deleteUser(@Param('id') id: number) {
    return this.usersService.deleteUser(id);
  }

  @Get('findAllRoles')
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Post('createRole')
  createRole(@Body() data: { id?: number; role: string }) {
    return this.usersService.createRole(data);
  }

  @Delete('deleteRole/:id')
  deleteRole(@Param('id') id: number) {
    return this.usersService.deleteRole(id);
  }
}
