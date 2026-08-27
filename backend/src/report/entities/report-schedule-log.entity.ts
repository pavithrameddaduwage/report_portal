import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('report_schedule_log')
export class ReportScheduleLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  schedule_id: number;

  @Column()
  schedule_name: string;

  @Column({ nullable: true })
  report_name: string;

  @Column({ nullable: true })
  display_view_name: string;

  @Column({ type: 'jsonb', default: [] })
  recipients: string[];

  @Column({ default: 'SUCCESS' })
  status: string; // SUCCESS or FAILED

  @Column({ default: 0 })
  records_count: number;

  @CreateDateColumn()
  execution_time: Date;

  @Column({ default: 0 })
  duration_ms: number;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ default: 'SCHEDULE' })
  triggered_by: string; // SCHEDULE or MANUAL
}
