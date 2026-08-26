import { User } from "src/users/entities/user.entity"

export class CreateLogDto {
    user:User
    log_type:string
    description:string
    old_value:string
    new_value:string
}
