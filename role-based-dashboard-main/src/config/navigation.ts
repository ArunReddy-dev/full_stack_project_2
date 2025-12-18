import {
  LayoutDashboard,
  Users,
  UserCog,
  ClipboardList,
  Paperclip,
  BarChart3,
  User,
  LucideIcon,
} from "lucide-react";
import { UserRole } from "@/types/auth";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "manager", "developer"],
        description: "Overview and statistics",
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Employees",
        href: "/dashboard/employees",
        icon: Users,
        roles: ["admin", "manager"],
        description: "Manage employee records",
      },
      {
        title: "Users",
        href: "/dashboard/users",
        icon: UserCog,
        roles: ["admin"],
        description: "User account management",
      },
    ],
  },
  {
    title: "Tasks",
    items: [
      {
        title: "All Tasks",
        href: "/dashboard/tasks",
        icon: ClipboardList,
        roles: ["admin", "manager", "developer"],
        description: "View and manage tasks",
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
        roles: ["admin", "manager"],
        description: "Task analytics and reports",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        href: "/dashboard/profile",
        icon: User,
        roles: ["admin", "manager", "developer"],
        description: "Your profile settings",
      },
    ],
  },
];

export const getNavItemsForRole = (role: UserRole): NavSection[] => {
  return navigationConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
};
