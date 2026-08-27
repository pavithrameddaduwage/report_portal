import axios from 'axios'
import { toast } from 'sonner'
import { baseUrl } from './baseUrl'

const API_URL = process.env.INTEGRATION_API_URL || baseUrl;

export const findAllReports = async (): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/report/findAllReports`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const findReportsByWorkspaceId = async (workspaceid: number): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/report/findReportsByWorkspaceId/` + workspaceid);
    return response;
  } catch (error) {
    throw error;
  }
};

export const createReport = async (data: any): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/report/createReport`, data);
    return response;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 500) {
      toast.error("Report name is duplicated");
    } else {
      toast.error(`An error occurred: ${status || "Unknown error"}`);
    }
    return error;
  }
};

export const createDisplayView = async (data: any): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/report/createDisplayView`, data);
    return response;
  } catch (error: any) {
    return error;
  }
};

export const findAllDisplayViews = async (): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/report/findAllDisplayViews`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteReport = async (id: number): Promise<any> => {
  try {
    const response = await axios.delete(`${API_URL}/report/deleteReport/` + id);
    return response;
  } catch (error) {
    throw error;
  }
};

export const findDisplayViewByReportId = async (id: number): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/report/findDisplayViewByReportId/` + id);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteDisplayView = async (id: number): Promise<any> => {
  try {
    const response = await axios.delete(`${API_URL}/report/deleteDisplayView/` + id);
    return response;
  } catch (error) {
    throw error;
  }
};
