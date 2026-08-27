import apiClient from './apiClient';

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
    const response = await apiClient.post(`/datawarehouse/getReportByParameters`, data);
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
    const response = await apiClient.post(`/datawarehouse/downloadReport`, data, {
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
    const response = await apiClient.post(`/datawarehouse/getColumnListBySchemaAndView`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getDistinctValues = async (data: {
  column: string;
  schema: string;
  view: string;
}): Promise<any> => {
  try {
    const response = await apiClient.post(`/datawarehouse/getDistinctValues`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getDistinctValuesForNumeric = async (data: {
  column: string;
  schema: string;
  view: string;
}): Promise<any> => {
  try {
    const response = await apiClient.post(`/datawarehouse/getDistinctValuesForNumeric`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getDisplayviewsByReportId = async (id: number): Promise<any> => {
  try {
    const response = await apiClient.get(`/datawarehouse/getDisplayviewsByReportId/` + id);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getItemsforDropdown = async (data: {
  view: string;
  schema: string;
  column: string;
}): Promise<any> => {
  try {
    const response = await apiClient.post(`/datawarehouse/getItemsforDropdown`, data);
    return response;
  } catch (error) {
    console.error("Error fetching items for dropdown:", error);
    return { status: 200, data: [] };
  }
};

