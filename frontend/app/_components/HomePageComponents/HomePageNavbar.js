"use client";
import React from "react";
import AuthNavbar from "../authComponent/AuthNavbar";
import { useSelector } from "react-redux";
import Navbar from "./Navbar";

const HomePageNavbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  return <>{!isAuthenticated ? <Navbar /> : <AuthNavbar />}</>;
};

export default HomePageNavbar;
