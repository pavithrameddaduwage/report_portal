import apiClient from './apiClient';

export interface ScheduleRecipient {
  name: string;
  email: string;
  department?: string;
}

export interface ReportScheduleItem {
  id?: number;
  schedule_name: string;
  workspace_id: number;
  workspace_name?: string;
  report_id: number;
  report_name?: string;
  display_view_id?: number;
  display_view_name?: string;
  cron_expression?: string;
  frequency_type: 'ONE_TIME' | 'MANUAL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY' | 'CUSTOM';

  frequency_details?: any;
  recipients: ScheduleRecipient[];
  email_subject?: string;
  email_body?: string;
  export_format: 'CSV' | 'EXCEL';
  is_active: boolean;
  last_run_at?: string | null;
  last_run_status?: 'SUCCESS' | 'FAILED' | null;
  created_at?: string;
}

export interface ScheduleLogItem {
  id: number;
  schedule_id: number;
  schedule_name: string;
  report_name: string;
  display_view_name: string;
  recipients: string[];
  status: 'SUCCESS' | 'FAILED';
  records_count: number;
  execution_time: string;
  duration_ms: number;
  error_message?: string | null;
  triggered_by: 'SCHEDULE' | 'MANUAL';
}

export const findAllSchedules = async (): Promise<any> => {
  return apiClient.get('/api/scheduler/schedules');
};

export const createSchedule = async (data: any): Promise<any> => {
  return apiClient.post('/api/scheduler/createSchedule', data);
};

export const updateSchedule = async (id: number, data: any): Promise<any> => {
  return apiClient.put(`/api/scheduler/updateSchedule/${id}`, data);
};

export const deleteSchedule = async (id: number): Promise<any> => {
  return apiClient.delete(`/api/scheduler/deleteSchedule/${id}`);
};

export const toggleScheduleActive = async (id: number): Promise<any> => {
  return apiClient.post(`/api/scheduler/toggleActive/${id}`, {});
};

export const runScheduleNow = async (id: number): Promise<any> => {
  return apiClient.post(`/api/scheduler/runNow/${id}`, {});
};

export const findAllScheduleLogs = async (): Promise<any> => {
  return apiClient.get('/api/scheduler/logs');
};

export const getSchedulerStats = async (): Promise<any> => {
  return apiClient.get('/api/scheduler/stats');
};


