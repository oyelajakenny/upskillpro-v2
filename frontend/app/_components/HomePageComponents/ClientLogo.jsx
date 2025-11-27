import React from "react";
import Image from "next/image";

const ClientLogoCarousel = () => {
  return (
    <div className="container mx-auto  my-14 text-center ">
      <h2 className="text-2xl font-semibold my-4 text-gray-500">
        Brands that trusts us
      </h2>
      <div className="overflow-hidden">
        <div className="flex justify-center items-center md:gap-x-16">
          {[
            { src: "/hyf.svg", alt: "Ericsson Logo" },
            { src: "/aws.png", alt: "VW Logo" },
            { src: "/elastic.png", alt: "Samsung Logo" },
            { src: "/prosa.png", alt: "Cisco Logo", size: "h-16 w-16" },
            { src: "/netlight.png", alt: "Vimeo Logo" },
            { src: "/Microsoft.webp", alt: "P and G Logo" },
            { src: "/Google.webp", alt: "HPE Logo" },
            { src: "/Zendesk-Logo.png", alt: "Citi Logo" },
          ].map((logo, index) => (
            <Image
              key={logo.alt}
              src={logo.src}
              alt={logo.alt}
              width={70}
              height={70}
              className={`${logo.size || "h-50 w-50"} object-contain `}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientLogoCarousel;
