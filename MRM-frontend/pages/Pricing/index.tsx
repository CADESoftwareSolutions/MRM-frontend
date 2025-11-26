import React from "react";
import Layout from "../../components/Layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Starter",
    price: "$29",
    frequency: "/month",
    description: "Perfect for individuals or small teams just getting started.",
    features: [
      "Basic account management",
      "Email support",
      "Access to standard tools",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$79",
    frequency: "/month",
    description: "For growing businesses that need more advanced features.",
    features: [
      "Everything in Starter",
      "Advanced analytics",
      "Priority support",
      "Team collaboration tools",
    ],
    highlighted: true,
  },
];

const Pricing = () => {
  return (
    <Layout>
      <section
        className="flex min-h-screen flex-col items-center px-4 py-16"
        style={{
          background:
            "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
        }}
      >
        {/* Header */}
        <div className="mb-12 max-w-2xl text-center">
          <h1 className="mb-4 text-5xl font-bold text-white">Our Pricing</h1>
          <p className="text-xl text-white/80">
            Choose the plan that works best for your business. Upgrade anytime
            as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`h-full rounded-3xl text-center transition-transform duration-300 hover:-translate-y-2 ${
                tier.highlighted
                  ? "border-4 border-purple-600 bg-white text-gray-900 shadow-2xl"
                  : "border-none bg-white/10 text-white shadow-xl"
              }`}
              style={{
                boxShadow: tier.highlighted
                  ? "0 8px 24px rgba(156, 39, 176, 0.4)"
                  : "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              <CardContent className="p-8">
                {/* Plan Name */}
                <h2 className="mb-2 text-3xl font-bold">{tier.name}</h2>

                {/* Description */}
                <p
                  className={`mb-4 text-sm ${
                    tier.highlighted ? "text-gray-600" : "text-white/70"
                  }`}
                >
                  {tier.description}
                </p>

                {/* Price */}
                <div className="mt-4">
                  <span className="text-5xl font-extrabold">{tier.price}</span>
                  <span
                    className={`ml-1 text-lg font-normal ${
                      tier.highlighted ? "text-gray-600" : "text-white/70"
                    }`}
                  >
                    {tier.frequency}
                  </span>
                </div>

                {/* Features List */}
                <div className="mt-6 space-y-3 text-left">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center">
                      <Check
                        className={`mr-2 h-5 w-5 flex-shrink-0 ${
                          tier.highlighted ? "text-purple-600" : "text-white"
                        }`}
                      />
                      <p
                        className={`text-sm ${
                          tier.highlighted ? "text-gray-900" : "text-white"
                        }`}
                      >
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  variant={tier.highlighted ? "default" : "outline"}
                  className={`mt-8 w-full rounded-xl py-6 text-base font-semibold ${
                    tier.highlighted
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "border-white text-white hover:bg-white/15"
                  }`}
                >
                  {tier.name === "Enterprise" ? "Contact Us" : "Get Started"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Pricing;
