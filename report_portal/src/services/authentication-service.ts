import apiClient from './apiClient';

export const login = async (data: { email: string; password: string }): Promise<any> => {
  try {
    const response = await apiClient.post(`/api/auth/login`, {
      username: data.email,
      pass: data.password,
    });
    return response;
  } catch (error) {
    console.error("login error:", error);
    throw error;
  }
};

export const searchADUsers = async (searchkey: string): Promise<any> => {
  try {
    const response = await apiClient.post(`/api/auth/searchUsers`, { searchkey });
    return response;
  } catch (error) {
    console.error("searchADUsers error:", error);
    return { data: [] };
  }
};
