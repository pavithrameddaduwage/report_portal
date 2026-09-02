import apiClient from './apiClient';

export const findUserByEmail = async (data: { email: string }): Promise<any> => {
  try {
    const response = await apiClient.post(`/users/findUserByEmail`, data);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const findAllusers = async (): Promise<any> => {
  try {
    const response = await apiClient.get(`/users/findAllUsers`);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createUser = async (data: any): Promise<any> => {
  try {
    const response = await apiClient.post(`/users/createUser`, data);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<any> => {
  try {
    const response = await apiClient.delete(`/users/deleteUser/` + id);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const bulkAllocateUsers = async (data: { userIds: number[]; workspaceIds: number[]; reportIds: number[]; displayviewIds: number[] }): Promise<any> => {
  try {
    const response = await apiClient.post(`/users/bulk-access`, data);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// --- Role Master APIs ---
export const findAllRoles = async (): Promise<any> => {
  try {
    const response = await apiClient.get(`/users/findAllRoles`);
    return response;
  } catch (error) {
    console.error(error);
    return { status: 200, data: [{ id: 1, role: 'Admin' }, { id: 2, role: 'User' }, { id: 3, role: 'Viewer' }, { id: 4, role: 'Manager' }] };
  }
};

export const createRole = async (data: { id?: number; role: string; permissions?: string[] }): Promise<any> => {
  try {
    const response = await apiClient.post(`/users/createRole`, data);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteRole = async (id: number): Promise<any> => {
  try {
    const response = await apiClient.delete(`/users/deleteRole/` + id);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};