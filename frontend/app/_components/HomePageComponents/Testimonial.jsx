import React from "react";
import Image from "next/image";
import { clientTestimonials } from "@/constants";
import Skeleton from "@mui/material/Skeleton";


const Testimonial = () => {
const isLoading = true;
  return (
    <div className="my-24">
      <div className="container mx-auto flex justify-between my-10">
        <h2 className="font-medium text-3xl">What Our Users Are Saying</h2>
        <h2 className="font-medium text-3xl">Explore Courses</h2>
      </div>
      <div className=" container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {clientTestimonials.map((testimonial, index) => (
          <div
            key={index}
            className=" bg-black rounded-2xl mx-7 lg:mx-0 md:mx-1 leading-loose text-center py-7 px-2 shadow-lg hover:bg-slate-500 transition-all even:bg-[#737373]"
          >
            <div className="rounded-full w-16 h-16 mx-auto mb-6 bg-slate-100">
              <Image
                src={testimonial.image}
                width={200}
                height={300}
                alt="Testimonial Images"
                className="rounded-full"
              />
            </div>

            <h2 className="text-lg font-semibold text-white mb-4 ">
              {testimonial.name}
            </h2>
            <p className=" text-[#D9D9D9]">{testimonial.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonial;
