import axios from 'axios'
import { baseUrl } from './baseUrl'

const API_URL = process.env.INTEGRATION_API_URL || baseUrl;

export const findAllWorkspaces = async (): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/workspace/findAllWorkspaces`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const createWorkspace = async (data: any): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/workspace/createWorkspace`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteWorkspace = async (id: number): Promise<any> => {
  try {
    const response = await axios.delete(`${API_URL}/workspace/deleteWorkspace/` + id);
    return response;
  } catch (error) {
    throw error;
  }
};

export const findWorkspaceById = async (id: number): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/workspace/findWorkspaceById/` + id);
    return response;
  } catch (error) {
    throw error;
  }
};