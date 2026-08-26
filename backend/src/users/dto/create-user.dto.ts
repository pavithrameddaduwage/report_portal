export class CreateUserDto {
    id:number
    email:string
    password:string
    name:string
    is_active:boolean
    user_roles:any[]
}
