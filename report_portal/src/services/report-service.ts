import axios from 'axios'
import { toast } from 'sonner'
import { baseUrl } from './baseUrl'

// const API_URL=process.env.INTEGRATION_API_URL || 'http://10.15.1.42:4009'
const API_URL=process.env.INTEGRATION_API_URL || baseUrl
// const API_URL=process.env.INTEGRATION_API_URL || 'https://hbs.hgusa.com/api/report-portal'

// const axiosInstance =axios.create({
//     baseURL:API_URL,
// })

export const findAllReports=async ():Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.get(`${API_URL}/report/findAllReports`)
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}


export const findReportsByWorkspaceId=async (workspaceid:number):Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.get(`${API_URL}/report/findReportsByWorkspaceId/`+ workspaceid)
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}




export const createReport=async (data:any):Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.post(`${API_URL}/report/createReport`,data)
        return response
    } catch (error:any) {
        const status = error?.response?.status;

       if (status === 500) {
        toast.error("Report name is duplicated")
       } else {
         alert(`An error occurred: ${status || "Unknown error"}`);
       }
   
       return error;
    }
}


export const createDisplayView=async (data:any):Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.post(`${API_URL}/report/createDisplayView`,data)
        return response
    } catch (error:any) {
          return error;
    }
}



export const findAllDisplayViews=async ():Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.get(`${API_URL}/report/findAllDisplayViews`)
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}


export const deleteReport=async (id:number):Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.delete(`${API_URL}/report/deleteReport/`+ id)
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const findDisplayViewByReportId=async (id:number):Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.get(`${API_URL}/report/findDisplayViewByReportId/`+ id)
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const deleteDisplayView = async (id: number): Promise<any> => {
    try {
        const response = await axios.delete(`${API_URL}/report/deleteDisplayView/` + id);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}





