import axios from 'axios'
import { baseUrl } from './baseUrl'

const API_URL = process.env.INTEGRATION_API_URL || baseUrl

export const findUserByEmail = async (data: { email: string }): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/users/findUserByEmail`, data);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const findAllusers = async (): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/users/findAllUsers`);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const createUser = async (data: any): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/users/createUser`, data);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const deleteUser = async (id: number): Promise<any> => {
  try {
    const response = await axios.delete(`${API_URL}/users/deleteUser/` + id);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// --- Role Master APIs ---
export const findAllRoles = async (): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/users/findAllRoles`);
    return response;
  } catch (error) {
    console.error(error);
    return { status: 200, data: [{ id: 1, role: 'Admin' }, { id: 2, role: 'User' }, { id: 3, role: 'Viewer' }, { id: 4, role: 'Manager' }] };
  }
}

export const createRole = async (data: { id?: number; role: string; permissions?: string[] }): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/users/createRole`, data);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const deleteRole = async (id: number): Promise<any> => {
  try {
    const response = await axios.delete(`${API_URL}/users/deleteRole/` + id);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}