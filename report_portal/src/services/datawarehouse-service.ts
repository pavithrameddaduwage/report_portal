import axios from 'axios'
import { baseUrl } from './baseUrl'

// const API_URL=process.env.INTEGRATION_API_URL || 'http://10.15.1.42:4009'
const API_URL=process.env.INTEGRATION_API_URL || baseUrl
// const API_URL=process.env.INTEGRATION_API_URL || 'https://hbs.hgusa.com/api/report-portal'

// const axiosInstance =axios.create({
//     baseURL:API_URL,
// })

export const getReportByParameters=async (data:{view:string,schema:string,page:number,pageSize:number,sortField?:string,displaycolumns:string[],sortOrder:string,filter?:string,columnfilter:any,download:boolean,reportid:number,display_view:number}):Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.post(`${API_URL}/datawarehouse/getReportByParameters`,data)
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}


export const downloadReport=async (data:{view:string,schema:string,page:number,pageSize:number,sortField?:string,displaycolumns:string[],reportid:number,sortOrder:string,filter?:string,columnfilter:any,filename:string,display_view:number}):Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.post(`${API_URL}/datawarehouse/downloadReport`,data,{
            responseType: 'arraybuffer', // 👈 VERY important
            headers: {
              'Content-Type': 'application/json',
            },
          })
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}


export const getColumnListBySchemaAndView=async (data:{view:string,schema:string}):Promise<any>=>{
    try {
        const response=await axios.post(`${API_URL}/datawarehouse/getColumnListBySchemaAndView`,data,{
            headers: {
              'Content-Type': 'application/json',
            },
          })
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const getItemsforDropdown=async (data:{view:string,schema:string,column:string}):Promise<any>=>{
    try {
        const response=await axios.post(`${API_URL}/datawarehouse/getItemsforDropdown`,data,{
            headers: {
              'Content-Type': 'application/json',
            },
          })
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}












