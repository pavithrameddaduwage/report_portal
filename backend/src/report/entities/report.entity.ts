import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, ManyToMany } from "typeorm";

import { ReportColumns } from "./report-columns.entity";
import { Workspace } from "src/workspace/entities/workspace.entity";
import { User } from "src/users/entities/user.entity";
import { DisplayView } from "./displayview.entity";


@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique:true})
  report_name: string;

  @Column({nullable: true})
  database_schema: string;

  @Column()
  report_view: string;

  @ManyToOne(()=>Workspace,workspace=>workspace.reports)
  workspace: Workspace;

  @OneToMany(()=>ReportColumns,rc=>rc.report,{cascade:true,eager:true,  orphanedRowAction: 'delete',})
  columns:ReportColumns[]

  @ManyToMany(()=>User,usr=>usr.reports,{cascade:false})
  users:User[]

  @OneToMany(()=>DisplayView,rv=>rv.report)
  display_view_names:DisplayView[]

  @CreateDateColumn()
  createdAt: Date;
}