import Image from "next/image";
import { useState } from "react";
import { Droplet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { X, Check } from "lucide-react";
export const ourFeatures = [
  {
    title: "Accounting Management",
    description:
      "Revenue, JIB and AFE management with the ability to drill down into revenue check details to ensure accurate payment of decimal interests, production months and product types",
    image: "/images/HomePage/revenueManagement.jpg",
    active: true,
    path: "/pages/Services/TaxManagement",
    slug: "accounting-management",
  },
  {
    title: "Deed, Lease and Surface Management",
    description:
      "Provide a comprehensive view of deeds, leases and surface ownership",
    image: "/images/HomePage/deed.jpg",
    active: false,
    path: "/pages/Services/TaxManagement",
    slug: "deed-lease-surface-management",
  },
  {
    title: "Well and Division Order Management",
    description:
      "Take control of your assets, track ownership, monitor well performance and confirm your decimal interest with the built-in calculator",
    image: "/images/HomePage/wellAndDivision.png",
    active: true,
    path: "/pages/Services/TaxManagement",
    slug: "well-division-order-management",
  },
  {
    title: "Acquisition/Divestiture/Operator Management",
    description:
      "Track changes in property ownership, operators and purchasers through a single, integrated system",
    image: "/images/HomePage/oil-management.jpg",
    active: false,
    path: "/pages/Services/TaxManagement",
    slug: "acquisition-divestiture-management",
  },
  {
    title: "Document Management/PDF Conversion",
    description:
      "Securely store documents and convert revenue check details to excel for easy analysis",
    image: "/images/HomePage/pdf.jpg",
    active: false,
    path: "/pages/Services/TaxManagement",
    slug: "document-management",
  },
  {
    title: "Tax Management",
    description:
      "Streamline Ad Valorem tax analysis and year-end tax reporting",
    image: "/images/HomePage/taxes.jpg",
    active: false,
    path: "/pages/Services/TaxManagement",
    slug: "tax-management",
  },
  {
    title: "Reports Management",
    description:
      "Access to a variety of reports, including the ability to create custom reports at the click of a button",
    image: "/images/HomePage/homePageImage4.jpg",
    active: false,
    path: "/pages/Services/TaxManagement",
    slug: "reports-management",
  },
];

const challenges = [
  "Spreadsheets that never match",
  "Old software that can’t keep up",
  "Missing documents",
  "Confusing ownership chains",
  "Slow reporting",
];

const solutions = [
  "Automated revenue validation",
  "Clear ownership & well tracking",
  "Integrated document + PDF tools",
  "Instant reporting",
  "Easy-to-use modern platform",
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
            management. Backed by over 95 years of combined experience in oil,
            gas and software development, our team is committed in delivering
            quality and proven results. Our platform streamlines revenue
            tracking, as well as lease, surface and document management so you
            can focus on what matters most.
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
                "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)",
            }}
          />

          <div className="absolute right-0 top-20 h-64 w-64 rounded-full bg-purple-200/30 blur-3xl" />
          <div className="absolute left-0 bottom-20 h-96 w-96 rounded-full bg-pink-200/20 blur-3xl" />

          <div className="relative mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <div className="mb-6 inline-block rounded-full bg-red-100 px-6 py-2">
                <span className="text-sm font-semibold uppercase tracking-wider text-red-600">
                  The Problem
                </span>
              </div>
              <h2 className="mb-4 text-5xl font-extrabold leading-tight text-gray-900 md:text-6xl">
                Managing minerals
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  shouldn't be this hard
                </span>
              </h2>
            </div>

            <div className="grid gap-4 md:gap-6">
              {challenges.map((c, idx) => (
                <div
                  key={idx}
                  className="group rounded-2xl border-2 border-red-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-red-200 hover:shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 transition-colors group-hover:bg-red-200">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="pt-2 text-lg font-medium text-gray-800">
                      {c}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="relative w-full px-4 py-20 md:py-32">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)",
            }}
          />
          <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-green-200/40 blur-3xl" />
          <div className="absolute right-1/4 bottom-10 h-80 w-80 rounded-full bg-purple-300/30 blur-3xl" />
          <div className="relative mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <div className="mb-6 inline-block rounded-full bg-green-100 px-6 py-2">
                <span className="text-sm font-semibold uppercase tracking-wider text-green-700">
                  The Solution
                </span>
              </div>
              <h2 className="mb-4 text-5xl font-extrabold leading-tight text-gray-900 md:text-6xl">
                That's why we built
                <br />
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  CADE
                </span>
              </h2>
            </div>

            <div className="mb-20 grid gap-4 md:gap-6">
              {solutions.map((s, idx) => (
                <div
                  key={idx}
                  className="group rounded-2xl border-2 border-green-100 bg-white/90 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-green-200 hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 transition-colors group-hover:bg-green-200">
                      <Check className="h-5 w-5 text-green-700" />
                    </div>
                    <p className="pt-2 text-lg font-medium text-gray-800">
                      {s}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 p-12 text-center shadow-2xl">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
              <h3 className="relative text-4xl font-black tracking-tight text-white md:text-5xl">
                Simple. Accurate. Powerful.
              </h3>
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
