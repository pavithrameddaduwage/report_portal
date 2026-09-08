import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RoleMaster } from '../users/entities/role_master.entity';
import { ADUser } from './interfaces/ad-user.interface';

const ActiveDirectory = require('activedirectory2');

const config = {
    url: process.env.LDAP_URL || 'ldap://HGUNBXDC01VM.Horizongroupusa.com',
    baseDN: process.env.LDAP_BASE_DN || 'dc=Horizongroupusa,dc=com',
    username: process.env.LDAP_USERNAME || 'MISSVCACC',
    password: process.env.LDAP_PASSWORD || 'Horizon@MIS',
    attributes:{
      user:[]
    },
    tlsOptions: {
      rejectUnauthorized: false,
    },
    timeout: 3000,  
    reconnect: false,
    connectTimeout: 3000,
};
const ad = new ActiveDirectory(config);

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoleMaster)
    private roleRepository: Repository<RoleMaster>,
  ) {}

  async authenticateuser(username: string, password: string, timeoutMs = 5000): Promise<boolean> {
    try {
      console.log('Attempting AD authentication for:', username);
      const authPromise = new Promise<boolean>((resolve) => {
        ad.authenticate(username, password, (err: any, auth: boolean) => {
          if (err) {
            console.log('AD authentication notice:', err?.message);
            resolve(false);
          } else {
            resolve(Boolean(auth));
          }
        });
      });

      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), timeoutMs);
      });

      return await Promise.race([authPromise, timeoutPromise]);
    } catch (error) {
      console.error('AD authentication unexpected error:', error);
      return false;
    }
  }

  async getADUserDetails(username: string): Promise<ADUser> {
    try {
      const detailsPromise = new Promise<ADUser>((resolve) => {
        ad.findUser(username, function (err: any, user: ADUser) {
          if (err || !user) {
            resolve(null as any);
          } else {
            resolve(user);
          }
        });
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));
      return (await Promise.race([detailsPromise, timeoutPromise])) as ADUser;
    } catch (e) {
      return null as any;
    }
  }

  async signIn(usernameInput: string, pass: string): Promise<any> {
    if (!usernameInput || !pass) {
      throw new UnauthorizedException('Username and password are required');
    }

    const trimmedInput = usernameInput.trim().toLowerCase();
    const cleanUsername = trimmedInput.split('@')[0];

    // ── Dev bypass: admin / admin ─────────────────────────────
    if (cleanUsername === 'admin' && pass === 'admin') {
      console.log('[DEV] Admin bypass login used');
      const allPermissions = [
        'report_config',
        'display_view',
        'workspace_management',
        'user_management',
        'report_scheduler',
        'roles_permissions',
        'csv_export',
        'filter_sort',
      ];
      const payload = {
        email: 'admin@hgusa.com',
        name: 'Admin',
        userid: 'admin',
        role: 'Admin',
        roles: ['Admin', 'admin'],
        permissions: allPermissions,
        is_admin: true,
        department: 'MIS',
        location: null,
      };
      return { access_token: await this.jwtService.signAsync(payload) };
    }
    // ──────────────────────────────────────────────────────────

    let email = '';
    let aduser: any = null;
    let adauthentication = false;

    if (trimmedInput.includes('@')) {
      // User entered a full email (e.g. user@horizongroupusa.com or user@hgusa.com)
      adauthentication = await this.authenticateuser(trimmedInput, pass);
      if (adauthentication) {
        email = trimmedInput;
      } else {
        // Retry alternate domain in case UPN differs
        const altDomain = trimmedInput.endsWith('@hgusa.com')
          ? trimmedInput.replace('@hgusa.com', '@horizongroupusa.com')
          : trimmedInput.replace('@horizongroupusa.com', '@hgusa.com');
        adauthentication = await this.authenticateuser(altDomain, pass);
        if (adauthentication) email = altDomain;
      }
    } else {
      // Username only: run parallel auth check against both corporate domains for instant response
      const [res1, res2] = await Promise.all([
        this.authenticateuser(`${cleanUsername}@horizongroupusa.com`, pass),
        this.authenticateuser(`${cleanUsername}@hgusa.com`, pass),
      ]);
      if (res1) {
        adauthentication = true;
        email = `${cleanUsername}@horizongroupusa.com`;
      } else if (res2) {
        adauthentication = true;
        email = `${cleanUsername}@hgusa.com`;
      }
    }

    if (!adauthentication) {
      console.log('AD Authentication failed for user:', usernameInput);
      throw new UnauthorizedException('Active Directory authentication failed - Please check your credentials');
    }

    // Fast-path lookup for existing user in DB
    let existingDbUser = await this.userRepository.findOne({
      where: [
        { email: ILike(email) },
        { email: ILike(`${cleanUsername}@horizongroupusa.com`) },
        { email: ILike(`${cleanUsername}@hgusa.com`) },
      ],
    });

    if (existingDbUser) {
      email = existingDbUser.email;
    } else {
      // New user: fetch details with 1s timeout fallback
      try {
        aduser = await this.getADUserDetails(cleanUsername);
      } catch (e) {}

      if (!aduser || !aduser.mail) {
        aduser = {
          mail: email || `${cleanUsername}@horizongroupusa.com`,
          cn: cleanUsername,
          department: null,
          location: null,
        };
      }
      email = (aduser.mail || email).toLowerCase();
    }

    // Role check & First Login Superadmin appointment
    let isUserAdmin = false;
    let userRole = 'User';
    let permissions: string[] = [];

    try {
      const totalUsersCount = await this.userRepository.count();

      if (!existingDbUser) {
        existingDbUser = await this.userRepository.findOne({
          where: { email: ILike(email) },
        });
      }

      if (totalUsersCount === 0) {
        // First user to ever log in is automatically appointed as Administrator!
        console.log(`[First-Time Setup] No users in database. Appointing first login user (${email}) as Administrator.`);
        const firstAdmin = new User();
        firstAdmin.name = aduser?.cn || cleanUsername;
        firstAdmin.email = email;
        firstAdmin.is_admin = true;
        firstAdmin.role = 'Admin';
        existingDbUser = await this.userRepository.save(firstAdmin);
      } else if (!existingDbUser) {
        // Auto-create new user upon AD login if not yet in database
        const newUser = new User();
        newUser.name = aduser?.cn || cleanUsername;
        newUser.email = email;
        newUser.is_admin = cleanUsername.toLowerCase() === 'admin' || email.toLowerCase() === 'admin@hgusa.com';
        newUser.role = newUser.is_admin ? 'Admin' : 'User';
        existingDbUser = await this.userRepository.save(newUser);
      }

      const userRolesList = String(existingDbUser?.role || '').split(',').map(r => r.trim().toLowerCase());
      isUserAdmin =
        Boolean(existingDbUser?.is_admin) ||
        userRolesList.includes('admin') ||
        email.toLowerCase() === 'admin@hgusa.com' ||
        cleanUsername.toLowerCase() === 'admin';

      userRole = existingDbUser?.role || (isUserAdmin ? 'Admin' : 'User');

      // Fetch permissions configured for this role from RoleMaster
      if (isUserAdmin) {
        permissions = [
          'report_config',
          'display_view',
          'workspace_management',
          'user_management',
          'report_scheduler',
          'roles_permissions',
          'csv_export',
          'filter_sort',
        ];
      } else {
        const roleNames = userRole.split(',').map(r => r.trim()).filter(Boolean);
        let combinedPerms: string[] = [];

        for (const rn of roleNames) {
          const roleRecord = await this.roleRepository.findOne({ where: { role: rn } });
          if (roleRecord && roleRecord.permissions) {
            try {
              const parsed = JSON.parse(roleRecord.permissions);
              if (Array.isArray(parsed)) {
                combinedPerms.push(...parsed);
              }
            } catch (e) {
              // Ignore parse errors for a single role
            }
          }
        }

        if (combinedPerms.length > 0) {
          permissions = Array.from(new Set(combinedPerms)); // Distinct permissions
        } else {
          permissions = ['csv_export', 'filter_sort'];
        }
      }
    } catch (dbError) {
      console.warn('User DB lookup warning on login:', dbError?.message);
    }

    const displayName = existingDbUser?.name || aduser?.cn || cleanUsername;

    const payload = {
      email: email,
      name: displayName,
      userid: cleanUsername,
      role: userRole,
      roles: isUserAdmin ? ['Admin', userRole] : [userRole],
      permissions: permissions,
      is_admin: isUserAdmin,
      department: aduser?.department || null,
      location: aduser?.location || null,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async searchUsers(query: string): Promise<any[]> {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();

    // 1. Query local database users for instant response
    let localMatches: any[] = [];
    try {
      const dbUsers = await this.userRepository.find({
        where: [
          { name: ILike(`%${q}%`) },
          { email: ILike(`%${q}%`) },
        ],
        take: 10,
      });
      localMatches = dbUsers.map((u) => ({
        name: u.name,
        email: (u.email || '').toLowerCase().trim(),
        department: 'Registered User',
      }));
    } catch (e) {
      console.warn('Local user search notice:', e?.message);
    }

    // 2. Query Active Directory LDAP
    const searchQuery = `(&(objectClass=user)(|(cn=*${query}*)(mail=*${query}*)(sAMAccountName=*${query}*)))`;
    let adMatches: any[] = [];

    try {
      const adPromise = new Promise<any[]>((resolve) => {
        let isDone = false;
        try {
          ad.findUsers(searchQuery, false, (err: any, users: any[]) => {
            if (isDone) return;
            isDone = true;
            if (err || !users || !Array.isArray(users)) {
              return resolve([]);
            }
            const formatted = users
              .filter((f: any) => f && (f.mail || f.cn || f.sAMAccountName))
              .map((f: any) => ({
                name: f.cn || f.displayName || f.sAMAccountName || '',
                email: (f.mail || `${f.sAMAccountName}@horizongroupusa.com`).toLowerCase().trim(),
                department: f.department || '',
              }));
            resolve(formatted);
          });
        } catch (e) {
          if (!isDone) {
            isDone = true;
            resolve([]);
          }
        }

        setTimeout(() => {
          if (!isDone) {
            isDone = true;
            resolve([]);
          }
        }, 3000);
      });

      adMatches = await adPromise;
    } catch (e) {
      console.warn('AD user search notice:', e?.message);
    }

    // Merge and deduplicate by email
    const seenEmails = new Set<string>();
    const combined: any[] = [];

    for (const u of [...adMatches, ...localMatches]) {
      const em = (u.email || '').toLowerCase().trim();
      if (em && !seenEmails.has(em)) {
        seenEmails.add(em);
        combined.push(u);
      }
    }

    return combined;
  }
}