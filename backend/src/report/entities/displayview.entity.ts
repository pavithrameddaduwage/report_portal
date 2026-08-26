import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Report } from "./report.entity";
import { DisplayViewColumns } from "./displayview-columns.entity";
import { User } from "src/users/entities/user.entity";

@Entity()
export class DisplayView{
    @PrimaryGeneratedColumn()
    id:number

    @Column({unique:true})
    displayview_name:string

    @ManyToOne(()=>Report,report=>report.display_view_names)
    report:Report

    @OneToMany(()=>DisplayViewColumns,dvc=>dvc.displayview,  {
        cascade: ['insert', 'update'],
        orphanedRowAction: 'delete',
        eager: true,
      },)
    displayview_columns:DisplayViewColumns[]

      @ManyToMany(()=>User,usr=>usr.displayviews,{cascade:false})
      users:User[]
}