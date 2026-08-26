import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, ManyToMany } from "typeorm";
import { Workspace } from "./workspace.entity";
import { ReportColumns } from "./report-columns.entity";
import { User } from "./user.entity";

@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  report_name: string;

  @Column({nullable: true})
  database_schema: string;

  @Column()
  report_view: string;

  @ManyToOne(()=>Workspace,workspace=>workspace.reports)
  workspace: Workspace;

  @OneToMany(()=>ReportColumns,rc=>rc.report,{cascade:true,eager:true})
  columns:ReportColumns[]

  @ManyToMany(()=>User,usr=>usr.reports)
  users:User[]

  @CreateDateColumn()
  createdAt: Date;
}