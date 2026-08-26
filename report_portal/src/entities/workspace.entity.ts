import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToMany } from "typeorm";
import { Report } from "./report.entity";
import { User } from "./user.entity";

@Entity()
export class Workspace {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique:true})
  name: string;

  @Column()
  description: string;

  @OneToMany(()=>Report,rpt=>rpt.workspace)
  reports: Report[];

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(()=>User,user=>user.workspaces)
  users:User[]
}