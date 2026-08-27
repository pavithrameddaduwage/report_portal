"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

const navItems = [
  { href: "/workspaces", label: "WORKSPACES" },
  {
    href: "/admin/report_configuration",
    label: "ADMIN PANEL",
    adminOnly: true,
  },
];

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        console.error("Invalid token", error);
        router.push("/login");
      }
    } else {
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [pathname]);

  const signingOut = async () => {
    try {
      localStorage.removeItem("access_token");
      router.push("/login");
    } catch (error) {
      router.push("/login");
    }
  };

  return (
    <header className="w-full bg-[#042646] h-14 px-6 flex items-center justify-between text-white shadow-sm z-50 shrink-0">
      {/* Left Branding */}
      <div className="flex items-center gap-3">
        <Link href="/workspaces" className="flex items-center gap-3">
          <img 
            src="/horizontal-blue-hgu-logo.png" 
            alt="Horizon Group USA" 
            className="h-7 object-contain"
            onError={(e: any) => {
              e.target.onerror = null;
              e.target.src = "/horizontal-blue-hgu-logo.png";
            }}
          />
          <span className="text-[#00c0f3] text-[20px] font-normal tracking-tight ml-2">
            Report Portal
          </span>
        </Link>
      </div>

      {/* Center Nav Links */}
      <nav className="flex items-center gap-8">
        {navItems.map((item) => {
          if (item.adminOnly && !user?.is_admin) return null;
          const isActive = pathname?.startsWith(item.href) || 
            (item.href.startsWith('/admin') && pathname?.startsWith('/admin'));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-[12px] font-semibold tracking-wider transition-colors uppercase",
                isActive 
                  ? "text-[#00c0f3]" 
                  : "text-white/80 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right User Info & Sign Out */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-white/90 font-normal">
          Welcome {user?.name || "Admin User"}
        </span>
        <Button
          size="sm"
          onClick={signingOut}
          className="h-7 px-4 rounded-full bg-[#dceefc] text-[#042646] hover:bg-white text-xs font-semibold shadow-xs border-0"
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
