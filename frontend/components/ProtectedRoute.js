"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const router = useRouter();

  if (!isAuthenticated) {
    // Redirect user to login page if not authenticated
    return children;
  }
  router.push("/login");
  return null;
};

export default ProtectedRoute;
