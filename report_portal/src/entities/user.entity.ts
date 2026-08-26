import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Workspace } from "./workspace.entity";
import {Report} from "./report.entity"

@Entity()
export class User{
    @PrimaryGeneratedColumn()
    id:number

    @Column({unique:true})
    email:string

    @Column()
    name:string

    @ManyToMany(()=>Workspace,workspace=>workspace.users)
    @JoinTable() 
    workspaces:Workspace[]

    @ManyToMany(()=>Report,report=>report.users)
    @JoinTable()
    reports:Report[]

}