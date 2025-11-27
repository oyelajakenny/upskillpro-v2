"use client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import Image from "next/image";

const LearningLoading = () => {
  return (
    <div className="fixed min-h-screen w-full bg-white left-0 top-0 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-1">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex items-center space-x-2 text-green-800"
        >
          <Loader2 className="animate-spin" />
          <span className="font-semibold tracking-wide">
            Please wait while we fetch your courses
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default LearningLoading;
