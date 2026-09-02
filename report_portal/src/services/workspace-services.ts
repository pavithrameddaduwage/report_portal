import apiClient from './apiClient';

export const findAllWorkspaces = async (): Promise<any> => {
  try {
    const response = await apiClient.get(`/workspace/findAllWorkspaces`);
    return response;
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return { status: 200, data: [] };
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

export const assignUsersToWorkspace = async (id: number, userIds: number[]): Promise<any> => {
  try {
    const response = await apiClient.post(`/workspace/${id}/assign-users`, { userIds });
    return response;
  } catch (error) {
    throw error;
  }
};