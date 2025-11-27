"use client";
import {
  AppBar,
  IconButton,
  Typography,
  Button,
  Toolbar,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
} from "@mui/material";
import Link from "next/link";
import React, { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout } from "@/features/auth/authSlice";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import Image from "next/image";
import { clearEnrolledCourses } from "@/features/course/courseSlice";

function Navbar() {
  const isMobile = useMediaQuery("(max-width:740px)");
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = () => {
    Cookies.remove("userName", { path: "/" });
    Cookies.remove("userRole", { path: "/" });
    Cookies.remove("userEmail", { path: "/" });
    dispatch(logout());
    dispatch(clearEnrolledCourses());
    router.push("/");
    toast.success("You're logged out");
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#000" }}>
      <Toolbar>
        {isMobile ? (
          <>
            <Button
              sx={{
                color: "white",
                border: "1px solid white",
                "&:hover": {
                  backgroundColor: "white",
                  color: "black",
                  border: "1px solid black",
                },
                borderRadius: "1px",
                padding: "2px 4px",
                marginLeft: "auto",
              }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Typography
              variant="h6"
              sx={{
                "&:hover": { textDecoration: "underline" },
                flexGrow: 1,
                color: "white",
              }}
            >
              <Link href={"/instructor-dashboard"}>UpSkill Pro</Link>
            </Typography>
            <div>
              <Link href="/instructor-dashboard" passHref>
                <Button
                  sx={{
                    color: "white",
                    "&:hover": {
                      backgroundColor: "white",
                      color: "black",
                    },
                  }}
                >
                  Dashboard
                </Button>
              </Link>
              <Button
                sx={{
                  color: "white",
                  border: "2px solid white",
                  "&:hover": {
                    backgroundColor: "white",
                    color: "black",
                    border: "2px solid black",
                  },
                  borderRadius: "2px",
                  padding: "4px 8px",
                  marginLeft: "2px",
                }}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
