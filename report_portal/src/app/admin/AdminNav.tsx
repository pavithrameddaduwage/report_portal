// components/MainNav.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { getUserPermissions, UserPermissions } from "@/lib/permissions";

export function AdminNav() {
  const [permissions, setPermissions] = useState<UserPermissions>({
    user: null,
    isAdmin: true,
    canAccessAdminPanel: true,
    canManageUsers: true,
    canManageWorkspaces: true,
    canConfigureReports: true,
    canConfigureDisplayViews: true,
    canScheduleReports: true,
    canManageRoles: true,
    canExportCsv: true,
    canFilterSort: true,
    permissions: [],
  });

  useEffect(() => {
    setPermissions(getUserPermissions());
  }, []);

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <NavigationMenu>
        <NavigationMenuList className="gap-6">
          {permissions.canConfigureReports && (
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navLinkStyle}>
                <Link href="/admin/report_configuration">Report</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
          {permissions.canConfigureDisplayViews && (
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navLinkStyle}>
                <Link href="/admin/display_view">Display View</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
          {permissions.canManageWorkspaces && (
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navLinkStyle}>
                <Link href="/admin/workspace_master">Workspace</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
          {permissions.canManageUsers && (
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navLinkStyle}>
                <Link href="/admin/user_management">Users</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
          {permissions.canScheduleReports && (
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navLinkStyle}>
                <Link href="/admin/report_scheduler">Scheduler</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
          {permissions.canManageRoles && (
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navLinkStyle}>
                <Link href="/admin/roles">Roles</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}

// Reusable style for navigation links
const navLinkStyle = cn(
  "text-[14px] font-semibold transition-all px-3 py-2 rounded-md",
  "hover:text-blue-500 hover:bg-blue-050", // Hover color
  "focus:text-blue-500 focus:bg-blue-050", // Focus state
  "text-text-600" // Default color
);