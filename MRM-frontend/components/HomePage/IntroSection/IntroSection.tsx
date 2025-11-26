import Image from "next/image";
import React from "react";

const homeImages = [
  {
    title: "Accounting & Revenue Management",
    image: "/images/homePage/homePageImage1.jpg",
    offset: "-20px",
  },
  {
    title: "Land & Mineral Management",
    image: "/images/homePage/homePageImage2.png",
    offset: "20px",
  },
  {
    title: "Document Management",
    image: "/images/homePage/homePageImage3.png",
    offset: "20px",
  },
  {
    title: "Reports Management",
    image: "/images/homePage/homePageImage4.jpg",
    offset: "-20px",
  },
];

const IntroSection = () => (
  <div
    className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center"
    style={{
      background:
        "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
    }}
  >
    <h1 className="mb-4 max-w-5xl text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
      Smarter Solutions for <span style={{ color: "#e91e63" }}>Integrated</span>{" "}
      Software
    </h1>
    <p className="mb-12 max-w-2xl text-base text-white opacity-90 md:text-lg">
      Designed for Accounting and Land Management - modern, reliable and built
      for growth
    </p>
    <div className="flex max-w-7xl items-center justify-center gap-6 lg:gap-8">
      {homeImages.map((feature, index) => (
        <div
          key={feature.title}
          style={{
            transform: `translateY(${feature.offset})`,
          }}
        >
          <div
            className="relative flex items-end justify-center overflow-hidden"
            style={{
              height: index === 1 || index === 2 ? "340px" : "320px",
              width: index === 1 || index === 2 ? "200px" : "200px",
              borderRadius: "50% / 30%",
            }}
          >
            <Image
              src={feature.image}
              alt={feature.title}
              layout="fill"
              objectFit="cover"
              style={{
                borderRadius: "50% / 30%",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.1))",
              }}
            />
            <div className="absolute bottom-4 left-1/2 w-[90%] -translate-x-1/2 px-4 py-1 text-center text-white">
              <p className="text-base font-bold leading-tight">
                {feature.title}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default IntroSection;
