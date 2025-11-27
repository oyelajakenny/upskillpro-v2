"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/features/auth/authSlice";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { WebSocketProvider } from "@/lib/websocket/WebSocketProvider";
import NotificationPanel from "@/components/admin/NotificationPanel";
import SecurityAlertsPanel from "@/components/admin/SecurityAlertsPanel";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Shield,
  MessageSquare,
  FileText,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
  Activity,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const AdminDashboardLayout = ({ children }) => {
  return (
    <AdminProtectedRoute>
      <WebSocketProvider>
        <AdminDashboardContent>{children}</AdminDashboardContent>
      </WebSocketProvider>
    </AdminProtectedRoute>
  );
};

const AdminDashboardContent = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [securityAlertPanelOpen, setSecurityAlertPanelOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  // Import WebSocket context at component level to avoid hook errors
  let wsContext = null;
  try {
    const {
      useWebSocketContext,
    } = require("@/lib/websocket/WebSocketProvider");
    wsContext = useWebSocketContext();
  } catch (error) {
    // WebSocket context not available
  }

  const unreadCount = wsContext?.unreadNotifications || 0;
  const securityAlertCount = wsContext?.unreadSecurityAlerts || 0;

  // Navigation items for the admin dashboard
  const navigationItems = [
    {
      name: "Dashboard Overview",
      href: "/admin-dashboard",
      icon: LayoutDashboard,
      current: pathname === "/admin-dashboard",
    },
    {
      name: "User Management",
      href: "/admin-dashboard/users",
      icon: Users,
      current: pathname.startsWith("/admin-dashboard/users"),
    },
    {
      name: "Course Management",
      href: "/admin-dashboard/courses",
      icon: BookOpen,
      current: pathname.startsWith("/admin-dashboard/courses"),
    },
    {
      name: "Analytics",
      href: "/admin-dashboard/analytics",
      icon: BarChart3,
      current: pathname.startsWith("/admin-dashboard/analytics"),
    },
    {
      name: "System Settings",
      href: "/admin-dashboard/settings",
      icon: Settings,
      current: pathname.startsWith("/admin-dashboard/settings"),
    },
    {
      name: "Security Monitor",
      href: "/admin-dashboard/security",
      icon: Shield,
      current: pathname.startsWith("/admin-dashboard/security"),
    },
    {
      name: "Support Center",
      href: "/admin-dashboard/support",
      icon: MessageSquare,
      current: pathname.startsWith("/admin-dashboard/support"),
    },
    {
      name: "System Health",
      href: "/admin-dashboard/system-health",
      icon: Activity,
      current: pathname.startsWith("/admin-dashboard/system-health"),
    },
    {
      name: "Maintenance",
      href: "/admin-dashboard/maintenance",
      icon: Wrench,
      current: pathname.startsWith("/admin-dashboard/maintenance"),
    },
    {
      name: "Audit Logs",
      href: "/admin-dashboard/audit",
      icon: FileText,
      current: pathname.startsWith("/admin-dashboard/audit"),
    },
  ];

  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    // Always start with Admin Dashboard
    breadcrumbs.push({
      name: "Admin Dashboard",
      href: "/admin-dashboard",
      current: pathname === "/admin-dashboard",
    });

    // Add subsequent segments
    if (pathSegments.length > 1) {
      for (let i = 1; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const href = "/" + pathSegments.slice(0, i + 1).join("/");
        const isLast = i === pathSegments.length - 1;

        breadcrumbs.push({
          name:
            segment.charAt(0).toUpperCase() +
            segment.slice(1).replace("-", " "),
          href: href,
          current: isLast,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleLogout = () => {
    // Clear authentication state
    dispatch(logout());

    // Clear localStorage tokens
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

    // Clear any session storage
    sessionStorage.clear();

    // Redirect to login page
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex ">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Logo and close button */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">UpSkillPro</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 ${
                      item.current ? "text-blue-700" : "text-gray-400"
                    }`}
                  />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* User info at bottom */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profilePicture} alt={user?.name} />
                <AvatarFallback>
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role === "super_admin"
                    ? "Super Administrator"
                    : "Administrator"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className=" bg-white w-full ">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 ">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile menu button and breadcrumbs */}
            <div className="flex items-center">
              <button
                className="lg:hidden mr-4"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6 text-gray-400" />
              </button>

              {/* Breadcrumbs */}
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <li key={breadcrumb.href} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                      )}
                      <a
                        href={breadcrumb.href}
                        className={`text-sm font-medium ${
                          breadcrumb.current
                            ? "text-gray-900"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        aria-current={breadcrumb.current ? "page" : undefined}
                      >
                        {breadcrumb.name}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            {/* Header actions */}
            <div className="flex items-center space-x-4">
              {/* Security Alerts */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setSecurityAlertPanelOpen(true)}
              >
                <AlertTriangle className="h-5 w-5" />
                {securityAlertCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white">
                    {securityAlertCount}
                  </Badge>
                )}
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setNotificationPanelOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-blue-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profilePicture} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role === "super_admin" ? "Super Admin" : "Admin"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 w-auto">
          <div className="py-6">{children}</div>
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
      />

      {/* Security Alerts Panel */}
      <SecurityAlertsPanel
        isOpen={securityAlertPanelOpen}
        onClose={() => setSecurityAlertPanelOpen(false)}
      />
    </div>
  );
};

export default AdminDashboardLayout;
