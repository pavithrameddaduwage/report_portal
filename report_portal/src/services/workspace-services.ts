import axios from 'axios'
import { baseUrl } from './baseUrl'

// const API_URL=process.env.INTEGRATION_API_URL || 'http://10.15.1.42:4009'
const API_URL=process.env.INTEGRATION_API_URL || baseUrl
// const API_URL=process.env.INTEGRATION_API_URL || 'https://hbs.hgusa.com/api/report-portal'

// const axiosInstance =axios.create({
//     baseURL:API_URL,
// })

export const findAllWorkspaces=async ():Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.get(`${API_URL}/workspace/findAllWorkspaces`)
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const createWorkspace=async (data:any):Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.post(`${API_URL}/workspace/createWorkspace`,data)
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}


export const deleteWorkspace=async (id:number):Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.delete(`${API_URL}/workspace/deleteWorkspace/`+ id)
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const findWorkspaceById=async (id:number):Promise<any>=>{
    console.log("API_URL",API_URL)
    try {
        const response=await axios.get(`${API_URL}/workspace/findWorkspaceById/`+ id)
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
}