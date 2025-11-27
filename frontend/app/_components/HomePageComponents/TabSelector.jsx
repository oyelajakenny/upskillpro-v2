"use client";
import Image from "next/image";
import React, { useState } from "react";

const features = [
  {
    title: "Bite-Sized Learning for Big Results",
    description:
      "Whether you have 10 minutes or an hour, you’ll always make progress.",
    details: [
      "We know attention spans are short—that's why our",
      "lessons are designed to be quick, impactful, and easy to",
      "fit into your day.",
    ],
    icon: "/Learning.png",
  },
  {
    title: "Earn Certifications That Matter",
    description:
      "Showcase your achievements with certifications recognized by industry leaders.",
    details: [
      "Certifications from UpSkillPro demonstrate your skills to ",
      "employers—helping you stand out in the job market and",
      "advance your career with confidence.",
    ],
    icon: "/certificate.png",
  },
  {
    title: "A Thriving Community of Learners",
    description:
      "Connect, collaborate, and grow with a global community of learners who share your passions and ambitions.",
    details: [
      "Join forums and attend virtual events—collaborate ",
      " on group projects, and grow alongside",
      " like-minded peers.",
    ],
    icon: "/community.png",
  },
  {
    title: "Learn Anywhere, Anytime",
    description:
      "Our mobile-friendly design means you can learn on the go, whether you’re at home, on the bus, or waiting for coffee.",
    details: [
      "Access lessons and resources anytime—whether ",
      "you're at home, commuting, or waiting for",
      " coffee on the go.",
    ],
    icon: "/time.png",
  },
];

const FeaturesSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-20 my-10  ">
      <div className="max-w-7xl mx-auto px-6 lg:px-8" >
        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-gray-600 mb-10">
          Unique Features of <span className="text-black">UpSkillPro</span>
        </h1>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-8">

  {/* Left Side: Tabs */}
  <div className="flex flex-col space-y-1">
    {features.map((feature, index) => (
      <div
        key={index}
        className={`p-4 rounded-lg shadow-md cursor-pointer flex items-center space-x-4 transition ${
          activeIndex === index
            ? "bg-gray-400 text-white" // Selected tab is gray
            : "bg-black text-white hover:bg-gray-600" // Unselected tabs are black
        }`}
        onClick={() => setActiveIndex(index)}
      >
        {/* Image Div */}
        <div className="flex-shrink-0">
          <Image
            src={feature.icon} // Icon source
            alt={feature.title} // Accessible alt text
            width={40}
            height={40}
            
          />
        </div>

        {/* Text Content */}
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">{feature.title}</h3>
          <p
            className={`text-sm mt-2 transition ${
              activeIndex === index ? "text-gray-300" : "text-gray-500"
            }`}
          >
            {feature.description}
          </p>
        </div>
      </div>
    ))}
  </div>
          {/* Right Side: Active Feature Details */}
          <div className="flex flex-col items-start justify-between space-y-6 ">
            {/* Details Text */}
            <div className="text-base text-gray-600 space-y-2 text-left">
              {features[activeIndex].details.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
            {/* Image */}
            <Image
              src="/illustration.png"
              alt="upskillpro"
              width={400}
              height={300}
              className="w-full max-w-sm rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
