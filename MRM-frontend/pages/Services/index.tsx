import React from "react";
import Layout from "../../components/Layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  FileText,
  Box,
  TrendingUp,
  Layers,
  ClipboardList,
  GitPullRequest,
} from "lucide-react";
import { ourFeatures } from "../../components/HomePage/AboutUs/AboutUs";
import { useRouter } from "next/router";

const iconMap: Record<string, React.ReactNode> = {
  "Accounting Management": <DollarSign className="w-12 h-12 text-white" />,
  "Deed, Lease and Surface Management": (
    <Layers className="w-12 h-12 text-white" />
  ),
  "Well and Division Order Management": (
    <TrendingUp className="w-12 h-12 text-white" />
  ),
  "Acquisition/Divestiture/Operator Management": (
    <GitPullRequest className="w-12 h-12 text-white" />
  ),
  "Document Management/PDF Conversion": (
    <FileText className="w-12 h-12 text-white" />
  ),
  "Tax Management": <ClipboardList className="w-12 h-12 text-white" />,
  "Reports Management": <Box className="w-12 h-12 text-white" />,
};

const Services: React.FC = () => {
  const router = useRouter();

  return (
    <Layout>
      <section className="bg-gray-100 py-16 px-4 md:px-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Services
          </h1>
          <p className="mt-3 text-lg md:text-xl text-gray-600">
            Explore the suite of services CADE offers for Oil & Gas management.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-10">
          {ourFeatures.map((service, index) => (
            <Card
              key={service.slug}
              onClick={() => router.push(`/Services/${service.slug}`)}
              className={`relative overflow-hidden rounded-2xl bg-white shadow-2xl border-0 transition-transform transform hover:-translate-y-2 hover:shadow-3xl cursor-pointer w-full md:w-[350px] h-[420px] ${
                index % 2 === 1 ? "mt-12 md:mt-20" : ""
              }`}
            >
              <div
                className="absolute top-0 left-0 w-full h-full z-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(128, 90, 213, 0.8) 0%, rgba(128, 90, 213, 0.2) 60%, rgba(255,255,255,0) 100%)",
                }}
              ></div>

              <CardContent className="relative flex flex-col h-full p-6 z-10 justify-between">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center break-words">
                  {service.title}
                </h3>

                <div className="flex flex-col items-center my-4 w-full">
                  <div className="flex justify-center mb-4">
                    {iconMap[service.title]}
                  </div>

                  <div
                    className="w-[80%] h-[2px] rounded-full"
                    style={{
                      background:
                        "linear-gradient(to right, rgba(128,90,213,0), rgba(128,90,213,0.6), rgba(128,90,213,0))",
                    }}
                  ></div>
                </div>

                <p className="text-gray-700 text-base md:text-lg text-center mt-4">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Services;
