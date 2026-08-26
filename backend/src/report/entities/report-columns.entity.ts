import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Report } from "./report.entity";


@Entity()
export class ReportColumns{
    @PrimaryGeneratedColumn()
    id: number;
    
    @Index()
    @Column()
    column:string

    @Column()
    displayName: string;

    @Column({default:false})
    hidden: boolean;

    @Column({default:0})
    sort_order:number

    @Column({nullable:true})
    filter_type:string

    @ManyToOne(()=>Report, report=>report.columns,{onDelete: 'CASCADE'})
    report:Report
}