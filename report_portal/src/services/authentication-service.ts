import axios from 'axios'
import { baseUrl } from './baseUrl'

const API_URL = process.env.INTEGRATION_API_URL || baseUrl

export const login = async (data: { email: string; password: string }): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      username: data.email,
      pass: data.password,
    });
    return response;
  } catch (error) {
    console.error("login error:", error);
    throw error;
  }
}

export const searchADUsers = async (searchkey: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/searchUsers`, { searchkey });
    return response;
  } catch (error) {
    console.error("searchADUsers error:", error);
    return { data: [] };
  }
}
