import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRoles } from './entities/user_roles.entity';
import { RoleMaster } from './entities/role_master.entity';
import { RoleAccess } from './entities/role_access.entity';
import { Report } from 'src/report/entities/report.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports:[TypeOrmModule.forFeature([User,UserRoles,RoleMaster,RoleAccess,Report]),HttpModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports:[UsersModule]
})
export class UsersModule {}
