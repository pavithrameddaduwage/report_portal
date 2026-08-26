import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { RoleMaster } from "./role_master.entity";

@Entity()
export class UserRoles{
    @PrimaryGeneratedColumn()
    id:number

    // @ManyToOne(()=>User,user=>user.user_roles)
    // user:User

    @ManyToOne(()=>RoleMaster,rolemaster=>rolemaster.user_roles)
    role:RoleMaster
}