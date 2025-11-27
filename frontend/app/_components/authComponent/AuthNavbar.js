"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ProfileDropdownMenu from "../HomePageComponents/ProfileAvatar";
import { Play } from "lucide-react";

const AuthNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="container mx-auto bg-white md:my-3 md:px-2">
      <div className="flex items-center justify-between px-3 md:px-6 py-4">
        <div className="flex items-center">
          <Link href="/" passHref>
            <Image
              src="/upskillpro_logo.png"
              alt="Logo"
              width={150}
              height={150}
              priority
            />
          </Link>
        </div>
        <ul className="hidden md:hidden lg:flex flex-1  justify-center items-center gap-6">
          <li>
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-500 font-semibold"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/courses"
              className="text-gray-700 hover:text-blue-500 font-semibold"
            >
              Explore
            </Link>
          </li>
          <li>
            <Link
              href="/courses"
              className="text-gray-700 hover:text-blue-500 font-semibold"
            >
              Courses
            </Link>
          </li>
          <li>
            <Link
              href="contact-us"
              className="text-gray-700 hover:text-blue-500 font-semibold"
            >
              Contact Us
            </Link>
          </li>
        </ul>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/my-learning" className="flex items-center gap-2">
            <Play size={30} />
            <h3 className="font-bold text-lg">My Courses</h3>
          </Link>
          <ProfileDropdownMenu />
        </div>
        <div className="md:hidden flex items-center gap-2">
          <Link href="/my-learning" className="flex items-center gap-2">
            <h3 className="font-bold text-lg">My Courses</h3>
          </Link>
          <ProfileDropdownMenu />
          <div
            className=" flex flex-col space-y-1 cursor-pointer"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-1 bg-black"></div>
            <div className="w-6 h-1 bg-black"></div>
            <div className="w-6 h-1 bg-black"></div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 bg-white z-20 transition-all duration-300 ease-in-out">
          <div className="flex justify-end p-4">
            <button
              onClick={closeMenu}
              className="text-gray-700 font-bold text-xl focus:outline-none"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col items-center gap-6 text-lg">
            <Link
              href="/"
              onClick={closeMenu}
              className="text-gray-700 hover:text-blue-500 font-semibold"
            >
              Home
            </Link>
            <Link
              href="/courses"
              onClick={closeMenu}
              className="text-gray-700 hover:text-blue-500 font-semibold"
            >
              Explore
            </Link>
            <Link
              href="/courses"
              onClick={closeMenu}
              className="text-gray-700 hover:text-blue-500 font-semibold"
            >
              Courses
            </Link>
            <Link
              href="/signup?role=instructor"
              onClick={closeMenu}
              className="text-gray-700 hover:text-blue-500 font-semibold"
            >
              Become an Instructor
            </Link>
            <Link
              href="/contact-us"
              onClick={closeMenu}
              className="text-gray-700 hover:text-blue-500 font-semibold"
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AuthNavbar;
