import {
  HttpException,
  Injectable,
  OnModuleInit,
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
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoleMaster)
    private roleRepository: Repository<RoleMaster>,
    @InjectRepository(UserRoles)
    private userrolesRepository: Repository<UserRoles>,
    private httpService: HttpService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultRolesAndPermissions();
    await this.seedAdminUser();
  }

  async seedAdminUser() {
    try {
      const adminUser = await this.userRepository.findOne({
        where: { email: 'admin@hgusa.com' }
      });
      if (!adminUser) {
        console.log('[Bootstrap] Creating default admin user in DB...');
        const user = new User();
        user.name = 'Admin';
        user.email = 'admin@hgusa.com';
        user.is_admin = true;
        user.role = 'Admin';
        await this.userRepository.save(user);
        console.log('[Bootstrap] Default admin user created successfully.');
      }
    } catch (err) {
      console.warn('[Bootstrap] Admin user seeding notice:', err?.message);
    }
  }

  async seedDefaultRolesAndPermissions() {
    try {
      const existing = await this.roleRepository.find();
      if (!existing || existing.length === 0) {
        console.log('[Bootstrap] Initializing Role & Permission Master Data in PostgreSQL...');
        const defaultRoles = [
          {
            role: 'Admin',
            permissions: JSON.stringify([
              'report_config',
              'display_view',
              'workspace_management',
              'user_management',
              'report_scheduler',
              'roles_permissions',
              'csv_export',
              'filter_sort',
            ]),
          },
          {
            role: 'User',
            permissions: JSON.stringify(['csv_export', 'filter_sort']),
          },
          {
            role: 'Viewer',
            permissions: JSON.stringify(['filter_sort']),
          },
          {
            role: 'Manager',
            permissions: JSON.stringify(['workspace_management', 'report_scheduler', 'csv_export', 'filter_sort']),
          },
        ];

        for (const r of defaultRoles) {
          const roleObj = new RoleMaster();
          roleObj.role = r.role;
          roleObj.permissions = r.permissions;
          await this.roleRepository.save(roleObj);
        }
        console.log('[Bootstrap] Role & Permission Master Data created successfully.');
      } else {
        // Ensure Admin role has report_scheduler if seed was previously run
        const adminRole = existing.find(r => r.role === 'Admin');
        if (adminRole) {
          let perms: string[] = [];
          try { perms = JSON.parse(adminRole.permissions || '[]'); } catch (e) {}
          if (!perms.includes('report_scheduler')) {
            perms.push('report_scheduler');
            adminRole.permissions = JSON.stringify(perms);
            await this.roleRepository.save(adminRole);
          }
        }
      }
    } catch (err) {
      console.warn('[Bootstrap] Role seeding notice:', err?.message);
    }
  }

  findAllUsers() {
    return this.userRepository.find({
      relations: ['workspaces', 'reports', 'displayviews'],
    });
  }

  async createUser(user: any) {
    let reports: Report[] = [];
    let workspaces: Workspace[] = [];
    let displayviews: DisplayView[] = [];

    (user.reportIds || []).forEach((f: any) => {
      if (f) {
        reports.push({ id: Number(f) } as Report);
      }
    });

    (user.workspaceIds || []).forEach((f: any) => {
      if (f) {
        workspaces.push({ id: Number(f) } as Workspace);
      }
    });

    (user.displayviewIds || []).forEach((f: any) => {
      if (f) {
        displayviews.push({ id: Number(f) } as DisplayView);
      }
    });

    let userEntity: User;
    if (user.id && Number(user.id) > 0) {
      userEntity =
        (await this.userRepository.findOne({
          where: { id: Number(user.id) },
          relations: ['workspaces', 'reports', 'displayviews'],
        })) || new User();
    } else {
      userEntity =
        (await this.userRepository.findOne({
          where: { email: ILike(user.email) },
          relations: ['workspaces', 'reports', 'displayviews'],
        })) || new User();
    }

    userEntity.name = user.name;
    userEntity.email = user.email;
    userEntity.reports = reports;
    userEntity.workspaces = workspaces;
    userEntity.displayviews = displayviews;
    userEntity.is_admin = user.is_admin === true || user.role === 'Admin';
    userEntity.role = user.role || (userEntity.is_admin ? 'Admin' : 'User');

    const output = await this.userRepository.save(userEntity);

    let roles = [];
    if (userEntity.is_admin) {
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
        console.log('External assignment notice:', error?.message);
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
        await this.seedDefaultRolesAndPermissions();
        const fresh = await this.roleRepository.find({ order: { id: 'ASC' } });
        return (fresh || []).map((f) => ({
          ...f,
          permissions: f.permissions ? JSON.parse(f.permissions) : [],
        }));
      }

      // Check if Admin role exists and has report_scheduler; if not, patch it in memory and DB
      let modified = false;
      const parsedRoles = roles.map((f) => {
        let perms: string[] = [];
        try {
          perms = f.permissions ? JSON.parse(f.permissions) : [];
        } catch (e) {
          perms = [];
        }
        if (f.role && f.role.toLowerCase() === 'admin' && !perms.includes('report_scheduler')) {
          perms.push('report_scheduler');
          f.permissions = JSON.stringify(perms);
          modified = true;
          this.roleRepository.save(f).catch(() => {});
        }
        return {
          ...f,
          permissions: perms,
        };
      });

      return parsedRoles;
    } catch (e) {
      console.error('Error fetching roles from DB:', e?.message);
      return [];
    }
  }

  async bulkAllocateUsers(data: { userIds: number[]; workspaceIds: number[]; reportIds: number[]; displayviewIds: number[] }) {
    if (!data.userIds || data.userIds.length === 0) return { success: true, message: 'No users provided' };

    const users = await this.userRepository.findByIds(data.userIds);
    
    let reports: Report[] = (data.reportIds || []).map(id => ({ id: Number(id) } as Report));
    let workspaces: Workspace[] = (data.workspaceIds || []).map(id => ({ id: Number(id) } as Workspace));
    let displayviews: DisplayView[] = (data.displayviewIds || []).map(id => ({ id: Number(id) } as DisplayView));

    for (const user of users) {
      user.reports = reports;
      user.workspaces = workspaces;
      user.displayviews = displayviews;
      await this.userRepository.save(user);
    }
    
    return { success: true, message: `Successfully updated ${users.length} users` };
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
