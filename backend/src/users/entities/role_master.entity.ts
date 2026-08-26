import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserRoles } from "./user_roles.entity";
import { RoleAccess } from "./role_access.entity";

@Entity()
export class RoleMaster {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  role: string;

  @Column({ type: 'text', nullable: true })
  permissions: string;

  @OneToMany(() => UserRoles, (userroles) => userroles.role)
  user_roles: UserRoles[];

  @OneToMany(() => RoleAccess, (roleaccess) => roleaccess.master_role)
  role_access: RoleAccess[];
}