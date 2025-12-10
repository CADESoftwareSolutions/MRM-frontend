import { Check, Droplet, Flame, Zap } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";
import Layout from "../../components/Layout/Layout";
import { ourFeatures } from "../../public/Documents/companyInfo";

const ServicePage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;

  if (!slug) return null;

  const service = ourFeatures.find((f) => f.slug === slug);

  if (!service) return null;

  const icons = [
    <Flame className="w-6 h-6" />,
    <Droplet className="w-6 h-6" fill="currentColor" />,
  ];

  return (
    <Layout>
      <div
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(to bottom, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        }}
      >
        <section className="relative overflow-hidden py-20 md:py-32 px-6">
          <div className="absolute top-20 right-20 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div
            className="absolute bottom-20 left-20 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute top-40 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#e91e63] rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"
            style={{ animationDelay: "1s" }}
          />

          <div className="relative mx-auto max-w-6xl text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 rounded-full border border-[#e91e63]/30 bg-black/30 backdrop-blur-sm">
              <Droplet className="w-4 h-4 text-[#e91e63]" fill="currentColor" />
              <span className="text-sm font-semibold text-[#e91e63] uppercase tracking-wider">
                Oil & Gas Solutions
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
              {service.title}
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-4xl mx-auto">
              {service.description}
            </p>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {service.sections?.map((section, sectionIdx) => (
                <div
                  key={sectionIdx}
                  className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-orange-500/30 transition-all duration-300 hover:bg-white/10 overflow-hidden"
                >
                  <div className="absolute bottom-0 left-0 right-0 h-32 opacity-5">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 1200 120"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                        fill="currentColor"
                        className="text-orange-500"
                      />
                    </svg>
                  </div>

                  <div className="relative mb-8">
                    <div className="inline-flex items-center gap-3 mb-4 px-4 py-2 rounded-xl bg-gradient-to-br from-orange-500 to-[#e91e63] text-white shadow-lg">
                      {icons[sectionIdx]}
                    </div>

                    <h2 className="text-3xl font-black text-white mb-3">
                      {section.title}
                    </h2>

                    <p className="text-gray-400 text-lg">
                      {section.description}
                    </p>
                  </div>

                  <div className="relative space-y-6">
                    {section.features?.map((feature, featureIdx) => (
                      <div key={featureIdx} className="group">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-[#e91e63] flex items-center justify-center shadow-md">
                              <Check
                                className="w-4 h-4 text-white"
                                strokeWidth={3}
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                              {feature.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>

                        {featureIdx < section.features.length - 1 && (
                          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-[#e91e63] to-purple-600 p-12 text-center shadow-2xl">
              <div className="absolute inset-0 opacity-10">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <line
                    x1="0"
                    y1="30"
                    x2="100"
                    y2="30"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <line
                    x1="0"
                    y1="50"
                    x2="100"
                    y2="50"
                    stroke="white"
                    strokeWidth="3"
                  />
                  <line
                    x1="0"
                    y1="70"
                    x2="100"
                    y2="70"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <circle cx="20" cy="30" r="3" fill="white" />
                  <circle cx="50" cy="50" r="4" fill="white" />
                  <circle cx="80" cy="70" r="3" fill="white" />
                </svg>
              </div>
              <div className="relative">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Flame className="w-8 h-8 text-white animate-pulse" />
                  <h3 className="text-3xl md:text-4xl font-black text-white">
                    Power Your Operations
                  </h3>
                  <Droplet
                    className="w-8 h-8 text-white animate-pulse"
                    fill="currentColor"
                    style={{ animationDelay: "1s" }}
                  />
                </div>
                <p className="text-xl text-white/90 mb-8">
                  Streamline your oil & gas management with {service.title}
                </p>
                <button className="px-8 py-4 bg-white text-[#e91e63] font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ServicePage;
