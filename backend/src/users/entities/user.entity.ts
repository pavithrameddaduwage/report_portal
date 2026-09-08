import { DisplayView } from "src/report/entities/displayview.entity";
import { Report } from "src/report/entities/report.entity";
import { Workspace } from "src/workspace/entities/workspace.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserRoles } from "./user_roles.entity";


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

    @Column({default: true})
    is_active: boolean;

    @ManyToMany(()=>Workspace,workspace=>workspace.users)
    @JoinTable() 
    workspaces:Workspace[]

    @ManyToMany(()=>Report,report=>report.users)
    @JoinTable()
    reports:Report[]


    @ManyToMany(()=>DisplayView,dv=>dv.users)
    @JoinTable()
    displayviews:DisplayView[]

    @OneToMany(()=>UserRoles, ur=>ur.user, {cascade: true})
    user_roles:UserRoles[]
}