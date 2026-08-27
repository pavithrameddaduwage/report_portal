import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('report_schedule')
export class ReportSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  schedule_name: string;

  @Column({ nullable: true })
  workspace_id: number;

  @Column({ nullable: true })
  workspace_name: string;

  @Column({ nullable: true })
  report_id: number;

  @Column({ nullable: true })
  report_name: string;

  @Column({ nullable: true })
  display_view_id: number;

  @Column({ nullable: true })
  display_view_name: string;

  @Column({ default: '0 8 * * *' })
  cron_expression: string;

  @Column({ default: 'DAILY' })
  frequency_type: string; // DAILY, WEEKLY, MONTHLY, HOURLY, CUSTOM

  @Column({ type: 'jsonb', nullable: true })
  frequency_details: any; // { time: "08:00", days: ["Monday"] }

  @Column({ type: 'jsonb', default: [] })
  recipients: { name: string; email: string; department?: string }[];

  @Column({ default: '' })
  email_subject: string;

  @Column({ type: 'text', default: '' })
  email_body: string;

  @Column({ default: 'CSV' })
  export_format: string; // CSV or EXCEL

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_run_at: Date;

  @Column({ nullable: true })
  last_run_status: string; // SUCCESS or FAILED

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
