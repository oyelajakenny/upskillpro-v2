import localFont from "next/font/local";
import "../_styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StoreProvider from "@/store/StoreProvider";
import HomePageNavbar from "../_components/HomePageComponents/HomePageNavbar";
// import Footer from "@/app/_components/HomePageComponents/Footer";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "UpSkillPro - Student Portal",
};

export default function StudentLayout({ children }) {
  return (
    <StoreProvider>
      {/* Navbar for authenticated student pages */}
      <HomePageNavbar />

      {/* Toast notifications */}
      <ToastContainer
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Main content area */}
      <main
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </main>

      {/* Footer */}
      {/* <Footer /> */}
    </StoreProvider>
  );
}
