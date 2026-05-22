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
import { userProfileAtom } from "../../src/atoms/userProfileAtom";
import { themeAtom } from "../../src/atoms/NavigationAtom";
import { useAtom } from "jotai";
import { useRouter } from "next/router";

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
  { icon: CheckSquare, label: "Process Check", route: "/Dashboard/checks" },
  { icon: FileText,    label: "Leases",         route: "/Dashboard/leases" },
  { icon: CreditCard,  label: "Make Payment",   route: "/Dashboard/checks" },
  { icon: BarChart3,   label: "View Reports",   route: "/Dashboard/reports" },
];

const REVENUE_DATA = [
  { month: "Aug", value: 28000 },
  { month: "Sep", value: 34000 },
  { month: "Oct", value: 29500 },
  { month: "Nov", value: 41000 },
  { month: "Dec", value: 37500 },
  { month: "Jan", value: 45231 },
];

const RevenueChart: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const W = 500;
  const H = 160;
  const padX = 40;
  const padY = 16;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const min = 0;
  const max = 50000;

  const toX = (i: number) => padX + (i / (REVENUE_DATA.length - 1)) * chartW;
  const toY = (v: number) => padY + chartH - ((v - min) / (max - min)) * chartH;

  const points = REVENUE_DATA.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - padY} L ${points[0].x} ${H - padY} Z`;

  const stroke = isLight ? "#9333ea" : "#a855f7";
  const fillId = isLight ? "areaLight" : "areaDark";
  const labelColor = isLight ? "#6b7280" : "rgba(255,255,255,0.45)";
  const gridColor = isLight ? "rgba(147,51,234,0.12)" : "rgba(255,255,255,0.06)";

  const yTicks = [0, 10000, 20000, 30000, 40000, 50000];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" style={{ height: 200 }}>
        <defs>
          <linearGradient id="areaLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9333ea" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#9333ea" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="areaDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y grid lines */}
        {yTicks.slice(1).map((tick) => (
          <line
            key={tick}
            x1={padX} y1={toY(tick)}
            x2={W - padX} y2={toY(tick)}
            stroke={gridColor} strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${fillId})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={stroke} />
        ))}

        {/* Month labels */}
        {REVENUE_DATA.map((d, i) => (
          <text key={i} x={toX(i)} y={H + 18} textAnchor="middle" fontSize="11" fill={labelColor}>
            {d.month}
          </text>
        ))}

        {/* Y-axis labels */}
        {yTicks.filter((_, i) => i % 2 === 0 && _ > 0).map((tick) => (
          <text key={tick} x={padX - 6} y={toY(tick) + 4} textAnchor="end" fontSize="10" fill={labelColor}>
            ${(tick / 1000).toFixed(0)}k
          </text>
        ))}
      </svg>
    </div>
  );
};

const DashboardHome: React.FC<DashboardHomeProps> = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const router = useRouter();

  return (
    <div className="p-6" style={{ marginTop: `64px` }}>
      <div className="mb-8">
        <h1 className={`text-4xl font-bold mb-2 ${isLight ? "text-gray-900" : "text-white"}`}>
          Welcome back {userProfile?.user?.username}!
        </h1>
        <p className={`text-lg ${isLight ? "text-gray-600" : "text-white/70"}`}>
          Here's what's happening with your business today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="backdrop-blur-lg hover:transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={isLight ? {
              background: "linear-gradient(135deg, rgb(237 233 254) 0%, rgb(252 231 243) 100%)",
              borderColor: "rgb(216 180 254 / 0.6)",
              boxShadow: "0 2px 12px 0 rgb(139 92 246 / 0.1)",
            } : {
              background: "linear-gradient(135deg, rgba(233, 30, 99, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)",
              borderColor: "rgba(233, 30, 99, 0.2)",
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${isLight ? "text-gray-700" : "text-white/85"}`}>
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>{stat.value}</div>
              <div
                className={`text-sm mt-2 flex items-center gap-1 ${
                  stat.trend === "up"
                    ? isLight ? "text-green-700" : "text-green-400"
                    : stat.trend === "down"
                    ? isLight ? "text-red-700" : "text-red-400"
                    : isLight ? "text-amber-700" : "text-yellow-400"
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
        <Card
          className="bg-white/5 border-white/10 backdrop-blur-lg transition-all duration-300"
          style={isLight ? {
            background: "white",
            borderColor: "rgb(167 139 250 / 0.5)",
            boxShadow: "0 2px 16px 0 rgb(139 92 246 / 0.12)",
          } : undefined}
        >
          <CardHeader>
            <CardTitle className={`text-xl ${isLight ? "text-gray-900" : "text-white"}`}>
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart isLight={isLight} />
          </CardContent>
        </Card>

        <Card
          className="bg-white/5 border-white/10 backdrop-blur-lg transition-all duration-300"
          style={isLight ? {
            background: "white",
            borderColor: "rgb(167 139 250 / 0.5)",
            boxShadow: "0 2px 16px 0 rgb(139 92 246 / 0.12)",
          } : undefined}
        >
          <CardHeader>
            <CardTitle className={`text-xl ${isLight ? "text-gray-900" : "text-white"}`}>
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
                    className={`flex items-center justify-between p-3 rounded-lg ${isLight ? "bg-purple-50 border border-purple-100" : "bg-white/5"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className={`font-medium ${isLight ? "text-gray-900" : "text-white"}`}>
                          {activity.title}
                        </div>
                        <div className={`text-sm flex items-center gap-1 ${isLight ? "text-gray-500" : "text-white/50"}`}>
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </div>
                      </div>
                    </div>
                    {activity.amount && (
                      <div className={`font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>
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
      <Card
        className="bg-white/5 border-white/10 backdrop-blur-lg"
        style={isLight ? {
          background: "white",
          borderColor: "rgb(167 139 250 / 0.5)",
          boxShadow: "0 2px 16px 0 rgb(139 92 246 / 0.12)",
        } : undefined}
      >
        <CardHeader>
          <CardTitle className={`text-xl ${isLight ? "text-gray-900" : "text-white"}`}>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={() => router.push(action.route)}
                  className={`h-auto flex-col gap-3 py-6 hover:scale-105 transition-all duration-200 cursor-pointer border ${
                    isLight
                      ? "bg-purple-50 border-purple-200 hover:bg-purple-100"
                      : "bg-white/5 border-white/10 hover:bg-purple-500/20"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLight ? "bg-purple-100 text-purple-700" : "bg-purple-500/20 text-purple-300"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`font-medium ${isLight ? "text-gray-800" : "text-white"}`}>{action.label}</span>
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
