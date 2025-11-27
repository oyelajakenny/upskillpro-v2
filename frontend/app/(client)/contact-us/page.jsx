"use client";

import React, { useState } from "react";

const ContactUs = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div
        className={`min-h-screen bg-gray-100 flex justify-center items-center pt-[80px] transition-all duration-300 ${
          isMenuOpen ? "mt-[250px]" : "mt-[80px]"
        }`}
      >
        <div className="bg-white shadow-lg rounded-xl p-8 sm:p-10 max-w-sm sm:max-w-lg w-full border-2 border-transparent hover:border-gray-300 transition-all duration-300">
          <h2 className="text-center text-3xl sm:text-4xl font-semibold text-gray-800 mb-6 sm:mb-8 tracking-wide leading-snug">
            Fill the form below to reach out to us
          </h2>
          <form className="space-y-4 sm:space-y-6">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                className="w-full p-3 sm:p-4 border border-black rounded-full text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 sm:p-4 border border-black rounded-full text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div>
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full p-3 sm:p-4 border border-black rounded-full text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div>
              <textarea
                className="w-full p-3 sm:p-4 border border-black rounded-xl text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                rows="4"
              />
           </div>

            <button
              type="submit"
              className="w-full py-3 sm:py-4 font-semibold rounded-full bg-black text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              SEND MESSAGE
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ContactUs;
