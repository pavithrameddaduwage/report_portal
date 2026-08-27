import axios from 'axios';
import { baseUrl } from './baseUrl';

const API_URL = process.env.INTEGRATION_API_URL || baseUrl;

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

const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      return { headers: { Authorization: `Bearer ${token}` } };
    }
  }
  return {};
};

export const findAllSchedules = async (): Promise<any> => {
  return axios.get(`${API_URL}/api/scheduler/schedules`, getAuthHeaders());
};

export const createSchedule = async (data: any): Promise<any> => {
  return axios.post(`${API_URL}/api/scheduler/createSchedule`, data, getAuthHeaders());
};

export const updateSchedule = async (id: number, data: any): Promise<any> => {
  return axios.put(`${API_URL}/api/scheduler/updateSchedule/${id}`, data, getAuthHeaders());
};

export const deleteSchedule = async (id: number): Promise<any> => {
  return axios.delete(`${API_URL}/api/scheduler/deleteSchedule/${id}`, getAuthHeaders());
};

export const toggleScheduleActive = async (id: number): Promise<any> => {
  return axios.post(`${API_URL}/api/scheduler/toggleActive/${id}`, {}, getAuthHeaders());
};

export const runScheduleNow = async (id: number): Promise<any> => {
  return axios.post(`${API_URL}/api/scheduler/runNow/${id}`, {}, getAuthHeaders());
};

export const findAllScheduleLogs = async (): Promise<any> => {
  return axios.get(`${API_URL}/api/scheduler/logs`, getAuthHeaders());
};

export const getSchedulerStats = async (): Promise<any> => {
  return axios.get(`${API_URL}/api/scheduler/stats`, getAuthHeaders());
};

