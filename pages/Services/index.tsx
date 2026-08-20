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
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/router";
import { ourFeatures } from "../../public/Documents/companyInfo";

const iconMap: Record<string, React.ReactNode> = {
  "accounting-management": <DollarSign className="h-7 w-7 text-white" />,
  "deed-lease-surface-management": <Layers className="h-7 w-7 text-white" />,
  "well-division-order-management": (
    <TrendingUp className="h-7 w-7 text-white" />
  ),
  "acquisition-divestiture-management": (
    <GitPullRequest className="h-7 w-7 text-white" />
  ),
  "document-management": <FileText className="h-7 w-7 text-white" />,
  "tax-management": <ClipboardList className="h-7 w-7 text-white" />,
  "reports-management": <Box className="h-7 w-7 text-white" />,
};

const Services: React.FC = () => {
  const router = useRouter();

  return (
    <Layout>
      <section
        className="px-4 py-20 md:px-16"
        style={{
          background:
            "linear-gradient(135deg, #ffffff 0%, #faf5ff 50%, #f3e8ff 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-6 inline-block rounded-full bg-purple-100 px-6 py-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-purple-700">
                What We Offer
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 md:text-5xl">
              Our Services
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Explore the suite of services CADE offers for Oil &amp; Gas
              management.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {ourFeatures.map((service) => (
              <Card
                key={service.slug}
                onClick={() => router.push(`/Services/${service.slug}`)}
                className="group w-full cursor-pointer overflow-hidden rounded-3xl border-0 bg-white shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl sm:w-[calc((100%-2rem)/2)] lg:w-[calc((100%-4rem)/3)]"
              >
                <CardContent className="flex h-full flex-col p-8">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    {iconMap[service.slug]}
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {service.title}
                  </h3>

                  <p className="flex-1 text-base leading-relaxed text-gray-600">
                    {service.description}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-purple-600">
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
