import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ADUser } from './interfaces/ad-user.interface';

const ActiveDirectory = require('activedirectory2').promiseWrapper;

const config = {
    url: 'ldap://HGUNBXDC01VM.Horizongroupusa.com',
    baseDN: 'dc=Horizongroupusa,dc=com',
    username: 'MISSVCACC',
    password: 'Horizon@MIS',
    attributes:{
      user:[]
    },
    tlsOptions: {
      rejectUnauthorized: false,
    },
    timeout: 30000,  
    reconnect: true,
    connectTimeout: 30000,
};
const ad = new ActiveDirectory(config);

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async authenticateuser(username: string, password: string): Promise<boolean> {
    try {
      console.log('Attempting AD authentication for:', username);
      return new Promise<boolean>((resolve) => {
        ad.authenticate(username, password, (err: any, auth: boolean) => {
          if (err) {
            console.log('AD authentication error:', err.message);
            resolve(false);
          } else {
            resolve(auth);
          }
        });
      });
    } catch (error) {
      console.error('AD authentication unexpected error:', error);
      return false;
    }
  }

  async getADUserDetails(username: string): Promise<ADUser> {
    let user = await new Promise<ADUser>((resolve, reject) => {
        ad.findUser(username, function(err: any, user: ADUser) {
            if (err) {
                reject(err);
            }
            if (user) {
                resolve(user);
            } else {
                resolve(null as any);
            }
        });
    });
    return user;
  }

  async signIn(username: string, pass: string): Promise<any> {
    username = username.toLowerCase().split('@')[0];

    // ── Dev bypass: admin / admin ─────────────────────────────
    if (username === 'admin' && pass === 'admin') {
      console.log('[DEV] Admin bypass login used');
      const payload = {
        email: 'admin@hgusa.com',
        name: 'Admin',
        userid: 0,
        roles: ['Admin', 'admin'],
        department: 'MIS',
        location: null,
      };
      return { access_token: await this.jwtService.signAsync(payload) };
    }
    // ──────────────────────────────────────────────────────────

    let email = '';
    let aduser: any = null;

    // Authenticate with AD
    let adauthentication = await this.authenticateuser(`${username}@hgusa.com`, pass);
    if (!adauthentication) {
      console.log('First domain auth failed, trying second domain...');
      adauthentication = await this.authenticateuser(`${username}@horizongroupusa.com`, pass);
    }

    if (!adauthentication) {
      console.log('AD Authentication failed for user:', username);
      throw new UnauthorizedException('Active Directory authentication failed - Please check your credentials');
    } else {
      console.log('AD Authentication successful, getting AD user details...');
      try {
        aduser = await this.getADUserDetails(username);
      } catch (e) {
        console.log('Failed to fetch AD details, continuing with basics');
      }
      
      if (!aduser || !aduser.mail) {
        // Mock fallback if AD details are missing
        aduser = {
          mail: `${username}@hgusa.com`,
          cn: username,
          department: null,
          location: null
        };
      }
      email = aduser.mail.toLowerCase();
    }

    const payload = {
      email: email,
      name: aduser.cn || username,
      userid: username,
      roles: ['User'],
      department: aduser.department,
      location: aduser.location
    };

    return {
      access_token: await this.jwtService.signAsync(payload)
    };
  }

  async searchUsers(query: string): Promise<any[]> {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    const searchQuery = `(&(objectClass=user)(|(cn=*${query}*)(mail=*${query}*)))`;
    let searchCompleted = false;

    const adPromise = new Promise<any[]>((resolve) => {
      try {
        ad.findUsers(searchQuery, true, (err: any, users: any[]) => {
          if (searchCompleted) return;
          if (err || !users || users.length === 0) {
            return resolve([]);
          }
          const formattedUsers = users
            .filter((f: any) => f.mail || f.cn)
            .map((f: any) => ({
              name: f.cn || f.displayName || f.sAMAccountName || '',
              email: (f.mail || `${f.sAMAccountName}@horizongroupusa.com`).toLowerCase(),
              department: f.department || '',
            }));
          searchCompleted = true;
          resolve(formattedUsers);
        });
      } catch (error) {
        resolve([]);
      }
      setTimeout(() => {
        if (!searchCompleted) {
          searchCompleted = true;
          resolve([]);
        }
      }, 3000);
    });

    const results = await adPromise;
    return results || [];
  }
}