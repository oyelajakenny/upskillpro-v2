import { useState } from "react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import Link from "next/link";
import { Avatar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/features/auth/authSlice";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { clearEnrolledCourses } from "@/features/course/courseSlice";
import { LayoutDashboard, User, BookOpen, LogOut } from "lucide-react";

const ProfileDropdownMenu = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogOut = () => {
    Cookies.remove("userName", { path: "/" });
    Cookies.remove("userRole", { path: "/" });
    Cookies.remove("userEmail", { path: "/" });
    dispatch(logout());
    dispatch(clearEnrolledCourses());
    router.push("/");
    toast.success("You are logged out");
    setIsOpen(false);
  };

  const userName = user && user.name ? user.name : "Guest";

  return (
    <Menu as="div" className="relative ml-3 flex justify-end">
      <div>
        <MenuButton
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-sm text-white">
            <Avatar>{userName ? userName.charAt(0).toUpperCase() : "U"}</Avatar>
          </div>
        </MenuButton>

        {isOpen && (
          <MenuItems className="absolute right-2 z-10 top-14 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 divide-y divide-gray-100">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>

            <div className="py-1">
              <MenuItem>
                {({ active }) => (
                  <Link
                    href="/student-dashboard"
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                )}
              </MenuItem>
              <MenuItem>
                {({ active }) => (
                  <Link
                    href="/student-dashboard/profile"
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Edit Profile
                  </Link>
                )}
              </MenuItem>
              <MenuItem>
                {({ active }) => (
                  <Link
                    href="/my-learning"
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <BookOpen className="h-4 w-4" />
                    My Learning
                  </Link>
                )}
              </MenuItem>
            </div>

            <div className="py-1">
              <MenuItem>
                {({ active }) => (
                  <button
                    onClick={handleLogOut}
                    className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm ${
                      active ? "bg-red-50 text-red-700" : "text-gray-700"
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                )}
              </MenuItem>
            </div>
          </MenuItems>
        )}
      </div>
    </Menu>
  );
};

export default ProfileDropdownMenu;
