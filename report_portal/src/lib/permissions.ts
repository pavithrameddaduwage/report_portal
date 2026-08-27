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
    const rawRole = String(decoded.role || "").toLowerCase();
    const isAdmin =
      decoded.is_admin === true ||
      decoded.isAdmin === true ||
      rawRole === "admin" ||
      rawRole === "administrator" ||
      roles.some((r) => {
        const str = String(r).toLowerCase();
        return str === "admin" || str === "administrator";
      }) ||
      decoded.email?.toLowerCase() === "admin@hgusa.com";

    const userPerms: string[] = Array.isArray(decoded.permissions) ? decoded.permissions : [];

    const hasPerm = (perm: string) => isAdmin || userPerms.includes(perm);

    const canManageUsers = isAdmin || hasPerm("user_management");
    const canManageWorkspaces = isAdmin || hasPerm("workspace_management");
    const canConfigureReports = isAdmin || hasPerm("report_config");
    const canConfigureDisplayViews = isAdmin || hasPerm("display_view");
    const canScheduleReports = isAdmin || hasPerm("report_scheduler") || hasPerm("scheduler");
    const canManageRoles = isAdmin || hasPerm("roles_permissions");
    const canExportCsv = isAdmin || hasPerm("csv_export");
    const canFilterSort = isAdmin || hasPerm("filter_sort");

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
