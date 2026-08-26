import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Report } from "./report.entity";
import { DisplayView } from "./displayview.entity";


@Entity()
export class DisplayViewColumns{
    @PrimaryGeneratedColumn()
    id: number;
    
    @Index()
    @Column()
    column:string

    @Column()
    function: string;

    @Column({nullable:true})
    parameter:string

    @ManyToOne(()=>DisplayView, dv=>dv.displayview_columns,{
        onDelete: 'CASCADE',          
        orphanedRowAction: 'delete'  
      })
    displayview:DisplayView
}