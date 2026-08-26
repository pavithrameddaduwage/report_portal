import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import {Report} from "./report.entity"

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

    @ManyToOne(()=>Report, report=>report.columns)
    report:Report
}