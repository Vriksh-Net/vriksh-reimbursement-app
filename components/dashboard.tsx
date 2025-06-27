"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart3,
  FileText,
  Home,
  Menu,
  Plus,
  Settings,
  Users,
  X,
  UserCheck,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userProfile, setUserRole, setUserProfile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    setUserProfile(null);
    setUserRole("employee");
    router.push("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    ...(userProfile?.role === "employee"
      ? [
          { name: "Submit Expense", href: "/dashboard/submit", icon: Plus },
          { name: "My Reports", href: "/dashboard/reports", icon: FileText },
        ]
      : []),
    ...(userProfile?.role === "admin"
      ? [
          {
            name: "All Reports",
            href: "/dashboard/admin/reports",
            icon: BarChart3,
          },
          {
            name: "Generate Reports",
            href: "/dashboard/admin/reports/generate",
            icon: Download,
          },
          {
            name: "Analytics",
            href: "/dashboard/admin/analytics",
            icon: BarChart3,
          },
          { name: "Users", href: "/dashboard/admin/users", icon: Users },
          {
            name: "Settings",
            href: "/dashboard/admin/settings",
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-semibold">Vriksh Reimbursement System</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <Image src="/Giflogo.gif" alt="Logo" width={150} height={150} />
            {/* <h1 className="text-md font-semibold">Reimbursement System</h1> */}
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold flex justify-start items-start">Vriksh Reimbursement System</h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Role Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Switch Role
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setUserRole("employee")} className="cursor-pointer">
                    👨‍💼 Employee View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUserRole("admin")} className="cursor-pointer">
                    👨‍💻 Admin View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full cursor-pointer"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {userProfile?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userProfile?.full_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userProfile?.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userProfile?.role} • {userProfile?.department}
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="hover:bg-red-200 cursor-pointer"
                      >
                        Logout
                      </Button>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      setUserRole(
                        userProfile?.role === "admin" ? "employee" : "admin"
                      )
                    }
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    <span>
                      Switch to{" "}
                      {userProfile?.role === "admin" ? "Employee" : "Admin"}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
