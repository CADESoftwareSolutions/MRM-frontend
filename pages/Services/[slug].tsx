import {
  Check,
  ChevronDown,
  Droplet,
  FileText,
  Flame,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import Layout from "../../components/Layout/Layout";
import { ourFeatures } from "../../public/Documents/companyInfo";

const ServicePage: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<any>([]);
  const router = useRouter();
  const { slug } = router.query;

  if (!slug) return null;

  const service = ourFeatures.find((f) => f.slug === slug);

  if (!service) return null;

  const toggleSection = (idx) => {
    setExpandedSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const icons = [
    <Flame className="w-6 h-6" key={"1"} />,
    <Droplet className="w-6 h-6" fill="currentColor" key={"1"} />,
    <Zap className="w-6 h-6" key={"1"} />,
    <TrendingUp className="w-6 h-6" key={"1"} />,
    <FileText className="w-6 h-6" key={"1"} />,
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
              <span className="text-lg font-semibold text-[#e91e63] uppercase tracking-wider">
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
          <div className="mx-auto max-w-5xl">
            <div className="space-y-4">
              {service.sections?.map((section, sectionIdx) => (
                <div
                  key={sectionIdx}
                  className="relative bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-purple-500/30 transition-all duration-300 overflow-hidden"
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

                  <button
                    onClick={() => toggleSection(sectionIdx)}
                    className="relative w-full p-8 text-left hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-br from-purple-500 to-[#e91e63] text-white shadow-lg">
                          {icons[sectionIdx % icons.length]}
                          <span className="text-lg font-black">
                            {sectionIdx + 1}
                          </span>
                        </div>

                        <div className="flex-1">
                          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                            {section.title}
                          </h2>
                          <p className="text-gray-400 text-base md:text-lg">
                            {section.description}
                          </p>
                        </div>
                      </div>

                      <ChevronDown
                        className={`w-7 h-7 text-gray-400 flex-shrink-0 transition-all duration-300 ${
                          expandedSections.includes(sectionIdx)
                            ? "rotate-180 text-purple-400"
                            : ""
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`transition-all duration-500 ease-in-out ${
                      expandedSections.includes(sectionIdx)
                        ? "max-h-[3000px] opacity-100"
                        : "max-h-0 opacity-0"
                    } overflow-hidden`}
                  >
                    <div className="relative px-8 pb-8 pt-2">
                      <div className="space-y-6">
                        {section.features?.map((feature, featureIdx) => (
                          <div key={featureIdx} className="group">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-[#e91e63] flex items-center justify-center shadow-md">
                                  <Check
                                    className="w-4 h-4 text-white"
                                    strokeWidth={3}
                                  />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                                  {feature.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed">
                                  {feature.description}
                                </p>
                              </div>
                            </div>

                            {featureIdx < section.features.length - 1 && (
                              <div className="mt-6 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ServicePage;
