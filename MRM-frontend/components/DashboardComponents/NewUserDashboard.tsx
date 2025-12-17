import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/router";

type NewUserDashboardProps = {};

const NewUserDashboard: React.FC<NewUserDashboardProps> = () => {
  const router = useRouter();

  interface OnboardingStep {
    icon: React.ElementType;
    title: string;
    description: string;
    action: string;
    route: string;
    color: string;
    bgColor: string;
  }

  const onboardingSteps: OnboardingStep[] = [
    {
      icon: CheckSquare,
      title: "Upload Your First Check",
      description:
        "Scan and upload check images to track payments and deposits automatically.",
      action: "Upload Check",
      route: "/Dashboard/DashboardDirectory/Checks",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      icon: FileText,
      title: "Add Documents",
      description:
        "Store important documents like contracts, invoices, and receipts securely.",
      action: "Add Document",
      route: "/Dashboard/DashboardDirectory/Documents",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: FileSpreadsheet,
      title: "View Your Leases",
      description:
        "Access and manage all your lease agreements and property information.",
      action: "View Leases",
      route: "/Dashboard/DashboardDirectory/Leases",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: TrendingUp,
      title: "Explore Reports",
      description:
        "Generate detailed financial reports and analytics for your business.",
      action: "See Reports",
      route: "/Dashboard/DashboardDirectory/Reports",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  const handleStepClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-8 w-8 text-yellow-400" />
          <h1 className="text-4xl font-bold">Welcome! Let's Get Started 🎉</h1>
        </div>
        <p className="text-lg text-white/70 mt-2">
          Follow these steps to set up your account and start managing your
          business
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {onboardingSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card
              key={index}
              className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
              onClick={() => handleStepClick(step.route)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${step.bgColor} ${step.color} mb-4`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="text-xs font-semibold text-white/50 bg-white/10 px-3 py-1 rounded-full">
                    Step {index + 1}
                  </div>
                </div>
                <CardTitle className="text-xl text-white mb-2">
                  {step.title}
                </CardTitle>
                <CardDescription className="text-white/60 text-base">
                  {step.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-[#e91e63] hover:bg-[#c2185b] text-white group-hover:scale-105 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepClick(step.route);
                  }}
                >
                  {step.action}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="font-semibold text-white mb-2">
                📸 Check Uploads
              </h4>
              <p className="text-sm text-white/60">
                Make sure your check images are clear and well-lit for best
                results
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="font-semibold text-white mb-2">
                📁 Organize Documents
              </h4>
              <p className="text-sm text-white/60">
                Use descriptive names when uploading to find files easily later
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="font-semibold text-white mb-2">
                📊 Track Progress
              </h4>
              <p className="text-sm text-white/60">
                Check your dashboard regularly to stay on top of your finances
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewUserDashboard;
