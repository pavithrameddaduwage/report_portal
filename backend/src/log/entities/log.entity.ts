import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Log {
    @PrimaryGeneratedColumn()
    id:number

    // @ManyToOne(()=>User,user=>user.logs)
    // user:User

    @Column()
    log_type:string

    @Column()
    description:string

    @Column({type:"text",nullable:true})
    old_value:string

    @Column({type:"text",nullable:true})
    new_value:string

    @CreateDateColumn({nullable:true,type:"timestamptz"})
    created_at:Date

}
