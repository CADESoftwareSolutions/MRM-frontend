import Image from "next/image";

import { Droplet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { X, Check } from "lucide-react";

const pairs = [
  {
    problem: "Land and accounting do not interact with each other",
    solution: "A truly integrated land and accounting system",
  },
  {
    problem: "Time wasted due to cumbersome and repetitive data entry",
    solution:
      "Data entry that will populate across multiple modules to maximize efficiency",
  },
  {
    problem: "Not fully knowing what you own",
    solution: "Clear visibility of your ownership and accurate asset tracking",
  },
  {
    problem: "Limited reporting that does not contain the information you need",
    solution:
      "Canned and customized reporting tailored to your specific requirements",
  },
  {
    problem: "Verify revenue manually",
    solution: "Automated revenue validation",
  },
  {
    problem: "Data limited to a PDF format",
    solution:
      "Integrated documents + PDF tools to convert and upload data with ease",
  },
  {
    problem: "Limited and outdated software",
    solution:
      "A platform built by industry experts who know what it takes to manage minerals",
  },
];

const benefits = [
  {
    title: "Accurate Data, Every Time",
    text: "Built-in validation ensures decimal interests, ownership, and production are correct.",
  },
  {
    title: "One Place for Everything",
    text: "Revenue, wells, leases, surface and documents — unified in a single system.",
  },
  {
    title: "Faster Decisions",
    text: "Search, filter, and analyze your portfolio instantly with powerful tools.",
  },
  {
    title: "Built by Industry Experts",
    text: "95+ years of combined oil, gas, land, and software experience.",
  },
];

const AboutUs = () => {
  return (
    <section
      className="px-4 py-20 md:px-16"
      style={{
        background: "linear-gradient(to bottom right, #ffffff, #f3e8ff)",
      }}
    >
      <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-4xl font-bold">Who we are</h2>

          <p className="mb-4 text-gray-600">
            At CADE Solutions, we simplify the complex world of mineral
            management. Backed by over 95 years of combined experience in oil
            and gas management and software development, our team is committed
            to delivering quality and proven results. Our platform streamlines
            revenue tracking, as well as lease, surface and document management
            so you can focus on what matters most.
          </p>
          <div className="mb-4 flex items-center text-gray-600">
            <Droplet className="mr-2 h-5 w-5" fill="currentColor" />
            <p>CADE brings clarity and makes the process straightforward.</p>
          </div>
          <div className="mb-4 flex items-center text-gray-600">
            <Droplet className="mr-2 h-5 w-5" fill="currentColor" />
            <p>CADE delivers trusted, accurate results.</p>
          </div>
          <div className="mb-4 flex items-center text-gray-600 ">
            <Droplet className="mr-2 h-5 w-5" fill="currentColor" />
            <p>CADE simplifies the process of managing your minerals.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {[
            "/images/HomePage/1.png",
            "/images/HomePage/2.jpg",
            "/images/HomePage/3.jpg",
            "/images/HomePage/4.jpg",
          ].map((img, index) => (
            <div key={index} className={index % 2 === 1 ? "mt-8" : ""}>
              <Card className="overflow-hidden rounded-lg shadow-md border-0 p-0 h-[240px]">
                <div className="relative w-full h-full">
                  <Image src={img} alt="image" fill className="object-cover" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <section className="relative w-full px-4 py-20 md:py-32">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(135deg, #f8f9fa 0%, #ede8f7 50%, #e9d5ff 100%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-14 md:grid-cols-2">
              {/* Problem card */}
              <div
                className="relative flex flex-col overflow-hidden rounded-3xl p-8 md:p-10"
                style={{
                  background:
                    "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)",
                }}
              >
                <div className="absolute left-1/4 top-10 h-48 w-48 rounded-full bg-red-200/30 blur-3xl" />
                <div className="absolute right-1/4 bottom-10 h-64 w-64 rounded-full bg-purple-300/30 blur-3xl" />

                <div className="relative mb-10 flex h-56 flex-col items-center justify-start pt-10 text-center">
                  <div className="mb-4 inline-block rounded-full bg-red-100 px-6 py-2">
                    <span className="text-sm font-semibold uppercase tracking-wider text-red-600">
                      The Problem
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
                    Managing Minerals Should Not Be This Hard
                  </h2>
                </div>

                <div className="relative flex flex-col gap-4">
                  {pairs.map((pair, idx) => (
                    <div
                      key={idx}
                      className="group flex min-h-24 items-center rounded-2xl border-2 border-red-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-red-200 hover:shadow-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100 transition-colors group-hover:bg-red-200">
                          <X className="h-4 w-4 text-red-600" />
                        </div>
                        <p className="text-lg font-medium text-gray-800">
                          {pair.problem}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solution card — offset lower */}
              <div
                className="relative flex flex-col overflow-hidden rounded-3xl p-8 md:p-10"
                style={{
                  background:
                    "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)",
                }}
              >
                <div className="absolute left-1/4 top-10 h-48 w-48 rounded-full bg-green-200/40 blur-3xl" />
                <div className="absolute right-1/4 bottom-10 h-64 w-64 rounded-full bg-purple-300/30 blur-3xl" />

                <div className="relative mb-10 flex h-56 flex-col items-center justify-start pt-10 text-center">
                  <div className="mb-4 inline-block rounded-full bg-green-100 px-6 py-2">
                    <span className="text-sm font-semibold uppercase tracking-wider text-green-700">
                      The Solution
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
                    That Is Why We Built{" "}
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      CADE
                    </span>
                  </h2>
                </div>

                <div className="relative flex flex-col gap-4">
                  {pairs.map((pair, idx) => (
                    <div
                      key={idx}
                      className="group flex min-h-24 items-center rounded-2xl border-2 border-green-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-green-200 hover:shadow-xl hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100 transition-colors group-hover:bg-green-200">
                          <Check className="h-4 w-4 text-green-700" />
                        </div>
                        <p className="text-lg font-medium text-gray-800">
                          {pair.solution}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative w-full px-4 py-20 md:py-32">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #faf5ff 50%, #f3e8ff 100%)",
            }}
          />

          <div className="mx-auto max-w-7xl">
            <div className="mb-20 text-center">
              <div className="mb-6 inline-block rounded-full bg-purple-100 px-6 py-2">
                <span className="text-sm font-semibold uppercase tracking-wider text-purple-700">
                  Our Difference
                </span>
              </div>
              <h2 className="text-5xl font-extrabold text-gray-900 md:text-6xl">
                Why CADE Works
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((item, index) => (
                <Card
                  key={index}
                  className="group relative overflow-hidden rounded-3xl border-0 bg-white shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
                  style={{
                    marginTop: index % 2 === 1 ? "2rem" : "0",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)",
                    }}
                  />

                  <CardContent className="relative flex flex-col items-center p-8 text-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                      <Check className="h-8 w-8 text-white" strokeWidth={3} />
                    </div>

                    <h3 className="mb-4 text-xl font-bold text-gray-900">
                      {item.title}
                    </h3>

                    <p className="text-base leading-relaxed text-gray-600">
                      {item.text}
                    </p>

                    <div className="mt-6 h-1 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 group-hover:w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};

export default AboutUs;
