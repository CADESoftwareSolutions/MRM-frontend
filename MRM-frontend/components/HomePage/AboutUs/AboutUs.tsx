import Image from "next/image";
import { useState } from "react";
import { Droplet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

const AboutUs = () => {
  const [activeIndex, setActiveIndex] = useState(0);

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

      <div>
        <h2 className="mb-2 text-4xl font-bold">What we do</h2>
        <p className="mb-8 text-lg font-semibold text-red-600">
          Take control of your Assets
        </p>

        <div className="flex flex-col gap-8 md:flex-row">
          <div className="w-full flex-shrink-0 md:w-[45%]">
            {ourFeatures.map((feature, index) => (
              <Card
                key={feature.title}
                onClick={() => setActiveIndex(index)}
                className={`mb-4 cursor-pointer rounded-lg p-4 transition-shadow hover:shadow-lg ${
                  index === activeIndex
                    ? "border-2 border-green-500 bg-green-50"
                    : "border border-gray-200 bg-white"
                }`}
              >
                <h3 className="font-semibold">{feature.title}</h3>
              </Card>
            ))}
          </div>

          <div
            className="flex w-full"
            style={{
              background: "linear-gradient(to bottom right, #f5f6fa, #f0f4ff)",
            }}
          >
            {ourFeatures
              .filter((f, index) => index === activeIndex)
              .map((activeFeature) => (
                <Card
                  key={activeFeature.slug}
                  className="h-[575px] w-full rounded-2xl bg-white p-0 shadow-2xl border-0"
                  style={{
                    boxShadow:
                      "0 10px 30px rgba(99, 102, 241, 0.25), 0 4px 12px rgba(0,0,0,0.08)",
                  }}
                >
                  <CardContent className="flex h-full flex-col p-5 md:p-10">
                    {/* Title */}
                    <div className="mb-4 text-left flex-shrink-0">
                      <h3 className="text-2xl font-bold tracking-wide text-gray-900">
                        {activeFeature.title}
                      </h3>
                    </div>

                    {/* Image fills remaining space */}
                    <div className="mb-4 relative flex-1 w-full overflow-hidden rounded-xl shadow-md">
                      <Image
                        src={activeFeature.image}
                        alt={activeFeature.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Description */}
                    <p className="text-left text-lg text-gray-600 flex-shrink-0">
                      {activeFeature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
