import { Report } from "src/report/entities/report.entity";
import { User } from "src/users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToMany } from "typeorm";


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