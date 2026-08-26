import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { DataSource, ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RoleMaster } from './entities/role_master.entity';
import { UserRoles } from './entities/user_roles.entity';
import { Report } from 'src/report/entities/report.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { DisplayView } from 'src/report/entities/displayview.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoleMaster)
    private roleRepository: Repository<RoleMaster>,
    @InjectRepository(UserRoles)
    private userrolesRepository: Repository<UserRoles>,
    private httpService: HttpService,
  ) {}

  findAllUsers() {
    return this.userRepository.find({
      relations: ['workspaces', 'reports', 'displayviews'],
    });
  }

  async createUser(user: any) {
    console.log(user);
    let reports: Report[] = [];
    let workspaces: Workspace[] = [];
    let displayviews: DisplayView[] = [];

    (user.reportIds || []).forEach((f: any) => {
      if (f) {
        reports.push({ id: f } as Report);
      }
    });

    (user.workspaceIds || []).forEach((f: any) => {
      if (f) {
        workspaces.push({ id: f } as Workspace);
      }
    });

    (user.displayviewIds || []).forEach((f: any) => {
      if (f) {
        displayviews.push({ id: f } as DisplayView);
      }
    });

    let newuser = new User();
    newuser.name = user.name;
    newuser.email = user.email;
    newuser.reports = reports;
    newuser.workspaces = workspaces;
    newuser.displayviews = displayviews;
    newuser.id = user.id;
    newuser.is_admin = user.is_admin === true || user.role === 'Admin';

    if (!user.id || user.id == null || user.id == 0) {
      delete newuser.id;
    }

    const output = await this.userRepository.save(newuser);

    let roles = [];
    if (newuser.is_admin) {
      roles = [15, 16];
    } else {
      roles = [16];
    }

    if (output) {
      const payload: any = {
        email: user.email,
        userName: user.name,
        department: '',
        webtoolId: 5,
        roleIds: roles,
        isActive: true,
      };

      try {
        await firstValueFrom(
          this.httpService.post(
            'https://hbs.hgusa.com/api/user-access-tool/user-webtools/external-assignment',
            payload,
          ),
        );
      } catch (error) {
        console.log('External assignment error:', error?.message);
      }

      return output;
    }
  }

  async findUserByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email: ILike(email) },
      relations: ['workspaces', 'reports', 'displayviews'],
    });
  }

  findUserById(id: number) {
    return this.userRepository.findOne({ where: { id: id } });
  }

  deleteUser(id: number) {
    return this.userRepository.delete({ id: id });
  }

  // --- Role & Permission Master Methods ---
  async findAllRoles() {
    try {
      const roles = await this.roleRepository.find({ order: { id: 'ASC' } });
      if (!roles || roles.length === 0) {
        const defaultRoles = [
          { role: 'Admin', permissions: JSON.stringify(['report_config', 'display_view', 'workspace_management', 'user_management', 'roles_permissions', 'csv_export', 'filter_sort']) },
          { role: 'User', permissions: JSON.stringify(['csv_export', 'filter_sort']) },
        ];
        for (const r of defaultRoles) {
          try {
            const roleObj = new RoleMaster();
            roleObj.role = r.role;
            roleObj.permissions = r.permissions;
            await this.roleRepository.save(roleObj);
          } catch (e) {}
        }
        const fresh = await this.roleRepository.find({ order: { id: 'ASC' } });
        return fresh.map((f) => ({
          ...f,
          permissions: f.permissions ? JSON.parse(f.permissions) : [],
        }));
      }
      return roles.map((f) => ({
        ...f,
        permissions: f.permissions ? JSON.parse(f.permissions) : [],
      }));
    } catch (e) {
      console.error('Error fetching roles from DB:', e?.message);
      return [];
    }
  }

  async createRole(data: { id?: number; role: string; permissions?: string[] }) {
    if (!data.role || data.role.trim() === '') {
      throw new HttpException('Role name is required', 400);
    }
    const roleName = data.role.trim();
    const perms = data.permissions || [];

    let roleObj: RoleMaster;
    if (data.id && data.id > 0) {
      roleObj = (await this.roleRepository.findOne({ where: { id: data.id } })) || new RoleMaster();
      roleObj.id = data.id;
    } else {
      roleObj = new RoleMaster();
    }
    roleObj.role = roleName;
    roleObj.permissions = JSON.stringify(perms);

    const saved = await this.roleRepository.save(roleObj);
    return {
      ...saved,
      permissions: perms,
    };
  }

  async deleteRole(id: number) {
    const numId = Number(id);
    try {
      await this.userrolesRepository.delete({ role: { id: numId } as any });
    } catch (e) {}
    await this.roleRepository.delete({ id: numId });
    return { success: true, message: 'Role deleted successfully' };
  }
}
