import localFont from "next/font/local";
import "../_styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import Footer from "../_components/HomePageComponents/Footer";
import StoreProvider from "@/store/StoreProvider";
import Navbar from "../_components/HomePageComponents/Navbar";

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
  title: "UpSkillPro",
};

export default function ClientLayout({ children }) {
  return (
    <StoreProvider>
      {/* Navbar and Toast Notifications for all client pages */}
      <Navbar />
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

      {/* Render the page content */}
      <main
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </main>

      {/* Footer for all client pages */}
      {/* <Footer /> */}
    </StoreProvider>
  );
}
