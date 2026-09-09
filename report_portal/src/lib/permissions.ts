import { jwtDecode } from "jwt-decode";

export interface UserPermissions {
  user: any;
  isAdmin: boolean;
  isSuperUser?: boolean;
  isAdminOnly?: boolean;
  canAccessAdminPanel: boolean;
  canAccessWorkspaces?: boolean;
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
    const rawRole = String(decoded.role || "").toLowerCase();
    const email = String(decoded.email || "").toLowerCase();
    const userid = String(decoded.userid || "").toLowerCase();

    const userRoleList = (decoded.role || "").split(',').map((r: string) => r.trim().toLowerCase());

    // Admin: Full access to Admin Panel
    const isAdmin =
      decoded.is_admin === true ||
      decoded.isAdmin === true ||
      userRoleList.includes("admin") ||
      userRoleList.includes("administrator") ||
      roles.some((r) => String(r).trim().toLowerCase() === "admin") ||
      email === "admin@hgusa.com" ||
      userid === "admin";

    // Super User: Full access to ALL Workspaces & Reports
    const isSuperUser =
      isAdmin ||
      userRoleList.includes("super user") ||
      userRoleList.includes("superuser") ||
      roles.some((r) => String(r).trim().toLowerCase() === "super user" || String(r).trim().toLowerCase() === "superuser");

    const hasWorkspaceRole =
      isSuperUser ||
      userRoleList.some((r: string) => r.includes("user") || r.includes("wsmember") || r === "workspace user") ||
      (Array.isArray(decoded.workspaces) && decoded.workspaces.length > 0);

    const isAdminOnly = false;
    const canAccessAdminPanel = isAdmin;
    const canAccessWorkspaces = true;

    const userPerms: string[] = Array.isArray(decoded.permissions) ? decoded.permissions : [];

    const hasPerm = (perm: string) => isAdmin || userPerms.includes(perm);

    const canManageUsers = isAdmin || hasPerm("user_management");
    const canManageWorkspaces = isAdmin || hasPerm("workspace_management");
    const canConfigureReports = isAdmin || hasPerm("report_config");
    const canConfigureDisplayViews = isAdmin || hasPerm("display_view");
    const canScheduleReports = isAdmin || hasPerm("report_scheduler") || hasPerm("scheduler");
    const canManageRoles = isAdmin || hasPerm("roles_permissions");
    const canExportCsv = isAdmin || isSuperUser || hasPerm("csv_export");
    const canFilterSort = isAdmin || isSuperUser || hasPerm("filter_sort");

    return {
      user: decoded,
      isAdmin,
      isSuperUser,
      isAdminOnly,
      canAccessAdminPanel,
      canAccessWorkspaces,
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
