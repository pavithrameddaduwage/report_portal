import apiClient from './apiClient';
import { toast } from 'sonner';

export const findAllReports = async (): Promise<any> => {
  try {
    const response = await apiClient.get(`/report/findAllReports`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const findReportsByWorkspaceId = async (workspaceid: number): Promise<any> => {
  try {
    const response = await apiClient.get(`/report/findReportsByWorkspaceId/` + workspaceid);
    return response;
  } catch (error) {
    throw error;
  }
};

export const createReport = async (data: any): Promise<any> => {
  try {
    const response = await apiClient.post(`/report/createReport`, data);
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
    const response = await apiClient.post(`/report/createDisplayView`, data);
    return response;
  } catch (error: any) {
    return error;
  }
};

export const findAllDisplayViews = async (): Promise<any> => {
  try {
    const response = await apiClient.get(`/report/findAllDisplayViews`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteReport = async (id: number): Promise<any> => {
  try {
    const response = await apiClient.delete(`/report/deleteReport/` + id);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateReport = async (id: number, data: any): Promise<any> => {
  try {
    const response = await apiClient.put(`/report/updateReport/` + id, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteDisplayView = async (id: number): Promise<any> => {
  try {
    const response = await apiClient.delete(`/report/deleteDisplayView/` + id);
    return response;
  } catch (error) {
    throw error;
  }
};

export const findReportById = async (id: number): Promise<any> => {
  try {
    const response = await apiClient.get(`/report/findReportById/` + id);
    return response;
  } catch (error) {
    throw error;
  }
};

export const findDisplayViewByReportId = async (id: number): Promise<any> => {
  try {
    const response = await apiClient.get(`/report/findDisplayViewByReportId/` + id);
    return response;
  } catch (error) {
    console.error("Error fetching display views by report id:", error);
    return { status: 200, data: [] };
  }
};

