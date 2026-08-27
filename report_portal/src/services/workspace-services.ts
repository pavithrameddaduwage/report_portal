import apiClient from './apiClient';

export const findAllWorkspaces = async (): Promise<any> => {
  try {
    const response = await apiClient.get(`/workspace/findAllWorkspaces`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const createWorkspace = async (data: any): Promise<any> => {
  try {
    const response = await apiClient.post(`/workspace/createWorkspace`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteWorkspace = async (id: number): Promise<any> => {
  try {
    const response = await apiClient.delete(`/workspace/deleteWorkspace/` + id);
    return response;
  } catch (error) {
    throw error;
  }
};

export const findWorkspaceById = async (id: number): Promise<any> => {
  try {
    const response = await apiClient.get(`/workspace/findWorkspaceById/` + id);
    return response;
  } catch (error) {
    throw error;
  }
};