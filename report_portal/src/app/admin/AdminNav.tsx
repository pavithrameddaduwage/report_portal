// components/MainNav.tsx

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

export function AdminNav() {
  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <NavigationMenu>
        <NavigationMenuList className="gap-6">
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navLinkStyle}>
              <Link href="/admin/report_configuration">
                Report
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navLinkStyle}>
              <Link href="/admin/display_view">
                Display View
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navLinkStyle}>
              <Link href="/admin/workspace_master">
                Workspace
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navLinkStyle}>
              <Link href="/admin/user_management">
                Users
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navLinkStyle}>
              <Link href="/admin/report_scheduler">
                Scheduler
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
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