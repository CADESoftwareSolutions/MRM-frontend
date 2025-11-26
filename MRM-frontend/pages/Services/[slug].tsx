import React from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import Image from "next/image";
import { ourFeatures } from "../../components/HomePage/AboutUs/AboutUs";

const dummyItems = [
  "Lorem ipsum dolor sit amet",
  "Consectetur adipiscing elit",
  "Integer molestie lorem at massa",
];

const ServicePage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;

  if (!slug) return null;

  const service = ourFeatures.find((f) => f.slug === slug);

  if (!service) return null;

  return (
    <Layout>
      <section
        className="flex min-h-[calc(100vh-120px)] items-center justify-center border-t border-white/10 p-4 shadow-2xl md:p-12"
        style={{
          background: "linear-gradient(to bottom right, #f5f6fa, #f0f4ff)",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Card
          className="h-[600px] w-full max-w-[1100px] rounded-2xl bg-white p-6 md:p-10 border-0"
          style={{
            boxShadow:
              "0 10px 30px rgba(99, 102, 241, 0.25), 0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <CardContent className="p-0">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-4xl font-bold tracking-wide text-gray-900">
                {service.title}
              </h1>
              <p className="text-lg text-gray-600">{service.description}</p>
            </div>
            <div className="grid grid-cols-1 items-center justify-center gap-8 md:grid-cols-2">
              <div className="overflow-hidden rounded-xl shadow-md h-[400px]">
                <Image
                  src={service.image}
                  alt={service.title}
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                {dummyItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center rounded-lg px-2 py-3"
                  >
                    <div className="mr-4 flex-shrink-0">
                      <Droplet
                        className="h-6 w-6 text-green-500 transition-transform duration-300"
                        fill="currentColor"
                      />
                    </div>
                    <p className="text-base text-gray-900">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
};

export default ServicePage;
