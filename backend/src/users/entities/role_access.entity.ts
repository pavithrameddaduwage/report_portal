import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserRoles } from "./user_roles.entity";
import { RoleMaster } from "./role_master.entity";

@Entity()

export class RoleAccess{
    @PrimaryGeneratedColumn()
    id:number

    @ManyToOne(()=>RoleMaster,rolemaster=>rolemaster.role_access)
    master_role:UserRoles

    @Column()
    role_access:string
}