import { jwtDecode } from "jwt-decode";

export interface UserPermissions {
  user: any;
  isAdmin: boolean;
  canAccessAdminPanel: boolean;
  canManageUsers: boolean;
  canManageWorkspaces: boolean;
  canConfigureReports: boolean;
  canConfigureDisplayViews: boolean;
  canScheduleReports: boolean;
  canManageRoles: boolean;
  canExportCsv: boolean;
  canFilterSort: boolean;
  permissions: string[];
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
      canScheduleReports: false,
      canManageRoles: false,
      canExportCsv: false,
      canFilterSort: false,
      permissions: [],
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
      canScheduleReports: false,
      canManageRoles: false,
      canExportCsv: false,
      canFilterSort: false,
      permissions: [],
    };
  }

  try {
    const decoded: any = jwtDecode(token);
    const roles: string[] = Array.isArray(decoded.roles) ? decoded.roles : [];
    const isAdmin =
      decoded.is_admin === true ||
      roles.some((r) => String(r).toLowerCase() === "admin") ||
      decoded.email?.toLowerCase() === "admin@hgusa.com";

    const userPerms: string[] = Array.isArray(decoded.permissions) ? decoded.permissions : [];

    const hasPerm = (perm: string) => isAdmin || userPerms.includes(perm);

    const canManageUsers = hasPerm("user_management");
    const canManageWorkspaces = hasPerm("workspace_management");
    const canConfigureReports = hasPerm("report_config");
    const canConfigureDisplayViews = hasPerm("display_view");
    const canScheduleReports = hasPerm("report_scheduler") || hasPerm("scheduler");
    const canManageRoles = hasPerm("roles_permissions");
    const canExportCsv = hasPerm("csv_export");
    const canFilterSort = hasPerm("filter_sort");

    const canAccessAdminPanel =
      isAdmin ||
      canManageUsers ||
      canManageWorkspaces ||
      canConfigureReports ||
      canConfigureDisplayViews ||
      canScheduleReports ||
      canManageRoles;

    return {
      user: decoded,
      isAdmin,
      canAccessAdminPanel,
      canManageUsers,
      canManageWorkspaces,
      canConfigureReports,
      canConfigureDisplayViews,
      canScheduleReports,
      canManageRoles,
      canExportCsv,
      canFilterSort,
      permissions: isAdmin
        ? [
            "report_config",
            "display_view",
            "workspace_management",
            "user_management",
            "report_scheduler",
            "roles_permissions",
            "csv_export",
            "filter_sort",
          ]
        : userPerms,
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
      canScheduleReports: false,
      canManageRoles: false,
      canExportCsv: false,
      canFilterSort: false,
      permissions: [],
    };
  }
}
