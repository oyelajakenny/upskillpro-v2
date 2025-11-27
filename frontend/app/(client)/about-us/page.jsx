import React from "react";
import { FaLinkedin } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import OurTeam from "../../_components/HomePageComponents/OurTeam.jsx";

const AboutUs = () => {
  return (
    <>
       <main className="container mx-auto bg-gray-50 text-gray-800  flex flex-col items-center pt-20">
        <div className="max-w-full sm:max-w-4xl bg-white border border-gray-800 p-8 shadow-lg mb-12">
          <h1 className="text-3xl font-bold text-black mb-8 text-left">
            About Us
          </h1>
          <p className="text-sm leading-relaxed mb-6 text-gray-700">
            At{" "}
            <strong className="font-semibold text-gray-800">UpSkillPRO</strong>,
            we’re redefining what it means to learn in the digital age. Designed
            with Gen Z in mind, we’re more than just an e-learning
            platform—we’re a movement for knowledge, creativity, and
            empowerment.
          </p>
          <p className="text-sm leading-relaxed mb-6 text-gray-700">
            Our mission is simple: make learning accessible, engaging, and
            tailored to your lifestyle. Whether you’re mastering a new skill,
            preparing for your dream career, or diving into a passion project,
            we’re here to help you grow, one lesson at a time.
          </p>
          <h2 className="text-sm font-normal mb-4 text-gray-800">
            What sets us apart?
          </h2>
          <ul className="list-disc pl-6 mb-6 text-sm text-gray-700">
            <li className="mb-3">
              <span className="font-normal text-gray-700">
                Bite-Sized, Powerful Lessons:
              </span>{" "}
              Learn on your terms, anytime, anywhere.
            </li>
            <li className="mb-3">
              <span className="font-normal text-gray-700">
                A Community of Creators:
              </span>{" "}
              Connect with inspiring instructors and like-minded peers who share
              your goals.
            </li>
            <li className="mb-3">
              <span className="font-normal text-gray-700">
                Interactive and Fun:
              </span>{" "}
              Forget boring textbooks—our platform is packed with videos,
              quizzes, and real-world projects.
            </li>
            <li className="mb-3">
              <span className="font-normal text-gray-700">
                Skills that Matter:
              </span>{" "}
              From tech to creativity to self-growth, our courses are built to
              keep you ahead of the curve.
            </li>
          </ul>

          <p className="text-sm leading-relaxed mb-6 text-gray-700">
            For instructors, we're the perfect partner to share your expertise,
            grow your personal brand, and earn while making a difference. For
            students, we're your gateway to knowledge that fits your vibe and
            vision for the future. At UpSkillPro we believe that learning should
            never feel like a chore - it should feel like an adventure.
            Together, let's unlock your potential and create a world where
            knowledge knows no limits.
          </p>

          <p className="text-sm leading-relaxed text-gray-700">
            Welcome to{" "}
            <strong className="font-semibold text-gray-800">UpSkillPRO</strong>
            —where Gen Z learns, creates, and thrives. 🚀
          </p>
        </div>

        
<OurTeam/>
        
      </main>
       </>
  );
};

export default AboutUs;
