import { jwtDecode } from "jwt-decode";

export interface UserPermissions {
  user: any;
  isAdmin: boolean;
  canAccessAdminPanel: boolean;
  canManageUsers: boolean;
  canManageWorkspaces: boolean;
  canConfigureReports: boolean;
  canConfigureDisplayViews: boolean;
}

export function getUserPermissions(): UserPermissions {
  if (typeof window === "undefined") {
    return {
      user: null,
      isAdmin: false,
      canAccessAdminPanel: false,
      canManageUsers: false,
      canManageWorkspaces: false,
      canConfigureReports: false,
      canConfigureDisplayViews: false,
    };
  }

  const token = localStorage.getItem("access_token");
  if (!token) {
    return {
      user: null,
      isAdmin: false,
      canAccessAdminPanel: false,
      canManageUsers: false,
      canManageWorkspaces: false,
      canConfigureReports: false,
      canConfigureDisplayViews: false,
    };
  }

  try {
    const decoded: any = jwtDecode(token);
    const roles: string[] = Array.isArray(decoded.roles) ? decoded.roles : [];
    const isAdmin =
      decoded.is_admin === true ||
      roles.some((r) => String(r).toLowerCase() === "admin") ||
      decoded.email?.toLowerCase() === "admin@hgusa.com";

    return {
      user: decoded,
      isAdmin,
      canAccessAdminPanel: isAdmin,
      canManageUsers: isAdmin,
      canManageWorkspaces: isAdmin,
      canConfigureReports: isAdmin,
      canConfigureDisplayViews: isAdmin,
    };
  } catch (e) {
    return {
      user: null,
      isAdmin: false,
      canAccessAdminPanel: false,
      canManageUsers: false,
      canManageWorkspaces: false,
      canConfigureReports: false,
      canConfigureDisplayViews: false,
    };
  }
}
