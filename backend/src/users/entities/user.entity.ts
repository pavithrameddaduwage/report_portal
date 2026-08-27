import { DisplayView } from "src/report/entities/displayview.entity";
import { Report } from "src/report/entities/report.entity";
import { Workspace } from "src/workspace/entities/workspace.entity";
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class User{
    @PrimaryGeneratedColumn()
    id:number

    @Column({unique:true})
    email:string

    @Column()
    name:string

    @Column({default:false})
    is_admin:boolean

    @Column({nullable:true, default: 'User'})
    role: string;

    @ManyToMany(()=>Workspace,workspace=>workspace.users)
    @JoinTable() 
    workspaces:Workspace[]

    @ManyToMany(()=>Report,report=>report.users)
    @JoinTable()
    reports:Report[]


    @ManyToMany(()=>DisplayView,dv=>dv.users)
    @JoinTable()
    displayviews:DisplayView[]
}