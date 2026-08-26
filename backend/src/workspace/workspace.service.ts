import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorkspaceService {
    constructor(
        @InjectRepository(Workspace)
        private readonly workspaceRepository:Repository<Workspace>
    ){}

    async findAllWorkspaces(){
        return this.workspaceRepository.find({relations:['reports']})
    }

    findWorkspaceById(id:any){
        return this.workspaceRepository.findOne({where:{id:id},relations:['reports']})
    }

    createWorkspace(workspace:any){
        if (!workspace.id || workspace.id==0){
            delete workspace.id
        }
        console.log("workspace",workspace)
       return this.workspaceRepository.save(workspace)
    }

    deleteWorkspace(workspaceid:any){
            return this.workspaceRepository.delete({id:workspaceid})
    }
}
