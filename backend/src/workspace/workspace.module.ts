import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { Report } from 'src/report/entities/report.entity';
import { DisplayView } from 'src/report/entities/displayview.entity';
import { RoleMaster } from 'src/users/entities/role_master.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Workspace,Report,DisplayView, RoleMaster])],

  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})

export class WorkspaceModule {}
