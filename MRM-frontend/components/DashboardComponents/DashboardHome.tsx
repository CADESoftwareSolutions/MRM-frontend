import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  CheckSquare,
  Clock,
  CreditCard,
  FileText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React from "react";
import { userProfileAtom } from "../../store/atoms/userProfileAtom";
import { useAtom } from "jotai";

type DashboardHomeProps = {};

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231",
    change: "+12.5%",
    trend: "up",
    subtitle: "from last month",
  },
  {
    title: "Pending Checks",
    value: "23",
    change: "5 require attention",
    trend: "neutral",
    subtitle: "",
  },
  {
    title: "Documents",
    value: "142",
    change: "8 uploaded today",
    trend: "neutral",
    subtitle: "",
  },
  {
    title: "Upcoming Payments",
    value: "$12,450",
    change: "Due this week",
    trend: "down",
    subtitle: "",
  },
];

const recentActivity = [
  {
    icon: CheckSquare,
    title: "Check #1234 processed",
    time: "2 hours ago",
    amount: "$2,500",
    color: "bg-pink-500/20 text-pink-500",
  },
  {
    icon: FileText,
    title: "New document uploaded",
    time: "5 hours ago",
    amount: null,
    color: "bg-purple-500/20 text-purple-500",
  },
  {
    icon: CreditCard,
    title: "Payment scheduled",
    time: "1 day ago",
    amount: "$5,200",
    color: "bg-pink-500/20 text-pink-500",
  },
];

const quickActions = [
  { icon: CheckSquare, label: "Process Check" },
  { icon: FileText, label: "Upload Document" },
  { icon: CreditCard, label: "Make Payment" },
  { icon: BarChart3, label: "View Reports" },
];

const DashboardHome: React.FC<DashboardHomeProps> = () => {
  const [userProfile, setUserProfile] = useAtom(userProfileAtom);

  return (
    <div className="p-6" style={{ marginTop: `64px` }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back {userProfile?.username}!
        </h1>
        <p className="text-lg text-white/70">
          Here's what's happening with your business today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(233, 30, 99, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)",
              borderColor: "rgba(233, 30, 99, 0.2)",
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div
                className={`text-sm mt-2 flex items-center gap-1 ${
                  stat.trend === "up"
                    ? "text-green-400"
                    : stat.trend === "down"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {stat.trend === "up" && <TrendingUp className="h-4 w-4" />}
                {stat.trend === "down" && <TrendingDown className="h-4 w-4" />}
                {stat.change}
                {stat.subtitle && ` ${stat.subtitle}`}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center border border-dashed border-white/20 rounded-lg text-white/40">
              Chart will be rendered here
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {activity.title}
                        </div>
                        <div className="text-sm text-white/50 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </div>
                      </div>
                    </div>
                    {activity.amount && (
                      <div className="font-semibold text-white">
                        {activity.amount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="h-auto flex-col gap-3 py-6 bg-white/5 hover:bg-[#e91e63]/30 border border-white/10 hover:scale-105 transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-pink-500/20 text-pink-500">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-white">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default DashboardHome;
