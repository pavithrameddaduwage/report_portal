import axios from 'axios'
import { baseUrl } from './baseUrl'

const API_URL = process.env.INTEGRATION_API_URL || baseUrl;

export const getReportByParameters = async (data: {
  view: string;
  schema: string;
  page: number;
  pageSize: number;
  sortField?: string;
  displaycolumns: string[];
  sortOrder: string;
  filter?: string;
  columnfilter: any;
  download: boolean;
  reportid: number;
  display_view: number;
}): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/datawarehouse/getReportByParameters`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const downloadReport = async (data: {
  view: string;
  schema: string;
  page: number;
  pageSize: number;
  sortField?: string;
  displaycolumns: string[];
  reportid: number;
  sortOrder: string;
  filter?: string;
  columnfilter: any;
  filename: string;
  display_view: number;
}): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/datawarehouse/downloadReport`, data, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getColumnListBySchemaAndView = async (data: { view: string; schema: string }): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/datawarehouse/getColumnListBySchemaAndView`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getItemsforDropdown = async (data: { view: string; schema: string; column: string }): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/datawarehouse/getItemsforDropdown`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};
