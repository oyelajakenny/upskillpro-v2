"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import adminSessionManager from "@/utils/adminSession";

const AdminProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is authenticated
        if (!isAuthenticated || !token) {
          router.push("/login?redirect=/admin-dashboard");
          return;
        }

        // Check if user has admin or super admin role
        if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
          // Redirect to appropriate dashboard based on role
          if (user?.role === "student") {
            router.push("/student-dashboard");
          } else if (user?.role === "instructor") {
            router.push("/instructor-dashboard");
          } else {
            router.push("/login");
          }
          return;
        }

        // Verify token is still valid by making a request to the backend
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          // Token is invalid or expired
          router.push("/login?redirect=/admin-dashboard");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Admin access verification failed:", error);
        router.push("/login?redirect=/admin-dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [isAuthenticated, token, user, router]);

  // Session timeout handling
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const checkTokenExpiry = () => {
      try {
        // Decode JWT token to check expiry (basic check)
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Date.now() / 1000;

        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          // Token expired
          router.push(
            "/login?redirect=/admin-dashboard&reason=session-expired"
          );
        }
      } catch (error) {
        console.error("Token validation error:", error);
        router.push("/login?redirect=/admin-dashboard");
      }
    };

    // Check token expiry every 5 minutes
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);

    // Check immediately
    checkTokenExpiry();

    return () => clearInterval(interval);
  }, [token, router, isAuthenticated]);

  // Initialize admin session management
  useEffect(() => {
    if (!isAuthenticated || !isAuthorized) return;

    const handleSessionExpired = (reason) => {
      console.log("Admin session expired:", reason);
      router.push(`/login?redirect=/admin-dashboard&reason=${reason}`);
    };

    const handleSessionWarning = () => {
      // Could show a warning modal here
      console.log("Admin session will expire soon");
    };

    adminSessionManager.init(handleSessionExpired, handleSessionWarning);

    return () => {
      adminSessionManager.cleanup();
    };
  }, [isAuthenticated, isAuthorized, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Verifying admin access...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 text-4xl mb-4">🚫</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-4">
                You don't have permission to access the admin dashboard.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Return to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
};

export default AdminProtectedRoute;
