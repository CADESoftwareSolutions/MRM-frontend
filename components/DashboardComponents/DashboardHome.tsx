import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  CheckSquare,
  Clock,
  CreditCard,
  FileText,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { userProfileAtom } from "../../src/atoms/userProfileAtom";
import { themeAtom, pageHeaderAtom } from "../../src/atoms/NavigationAtom";
import { useRouter } from "next/router";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

// ── Metric pool ──────────────────────────────────────────────────────────────
const METRIC_POOL = [
  { id: "totalRevenue",     title: "Total Revenue",     value: "$45,231", change: "+12.5%",             trend: "up"      },
  { id: "pendingChecks",    title: "Pending Checks",    value: "23",      change: "5 require attention", trend: "neutral" },
  { id: "documents",        title: "Documents",         value: "142",     change: "8 uploaded today",    trend: "neutral" },
  { id: "upcomingPayments", title: "Upcoming Payments", value: "$12,450", change: "Due this week",       trend: "down"    },
  { id: "totalWells",       title: "Total Wells",       value: "18",      change: "+2 this quarter",     trend: "up"      },
  { id: "missingDeeds",     title: "Missing Deeds",     value: "7",       change: "Needs attention",     trend: "down"    },
  { id: "reports",          title: "Reports",           value: "34",      change: "3 generated today",   trend: "neutral" },
];
const DEFAULT_METRICS = ["totalRevenue", "pendingChecks", "documents", "upcomingPayments"];
const STORAGE_KEY = "mrm-dashboard-metrics";
const MAX_METRICS = 4;

// ── Date range options ────────────────────────────────────────────────────────
const DATE_RANGES = [
  { label: "Last 7 Days",  value: "7d"  },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last Quarter", value: "90d" },
  { label: "This Year",    value: "1y"  },
  { label: "All Time",     value: "all" },
];

// ── Alerts ────────────────────────────────────────────────────────────────────
const alerts = [
  {
    icon: CheckSquare,
    title: "Check #1234 Processed",
    detail: "Pioneer Natural Resources",
    time: "2 hours ago",
    amount: "$2,500",
    route: "/Dashboard/checks",
    iconColor: "bg-pink-500/20 text-pink-400",
  },
  {
    icon: FileText,
    title: "New Document Uploaded",
    detail: "Lease_Agreement_2024.pdf",
    time: "5 hours ago",
    amount: null,
    route: "/Dashboard/documents",
    iconColor: "bg-purple-500/20 text-purple-400",
  },
  {
    icon: CreditCard,
    title: "AP Payment Due",
    detail: "Anadarko Petroleum",
    time: "1 day ago",
    amount: "$5,200",
    route: "/Dashboard/checks",
    iconColor: "bg-amber-500/20 text-amber-400",
  },
];

// ── Quick access ──────────────────────────────────────────────────────────────
const quickAccess = [
  { icon: CheckSquare, label: "Process Revenue Checks", route: "/Dashboard/checks"  },
  { icon: FileText,    label: "Set Up New Lease/Deed",  route: "/Dashboard/leases"  },
  { icon: CreditCard,  label: "Process AP Payments",    route: "/Dashboard/checks"  },
  { icon: BarChart3,   label: "View Reports",           route: "/Dashboard/reports" },
];

// ── Revenue chart ─────────────────────────────────────────────────────────────
const REVENUE_DATA = [
  { month: "Aug", value: 28000 },
  { month: "Sep", value: 34000 },
  { month: "Oct", value: 29500 },
  { month: "Nov", value: 41000 },
  { month: "Dec", value: 37500 },
  { month: "Jan", value: 45231 },
];

const RevenueChart: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const W = 500; const H = 160;
  const padX = 40; const padY = 12;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const max = 50000;
  const toX = (i: number) => padX + (i / (REVENUE_DATA.length - 1)) * chartW;
  const toY = (v: number) => padY + chartH - (v / max) * chartH;
  const points = REVENUE_DATA.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - padY} L ${points[0].x} ${H - padY} Z`;
  const stroke = "#9333ea";
  const labelColor = isLight ? "#6b7280" : "rgba(255,255,255,0.45)";
  const gridColor = isLight ? "rgba(147,51,234,0.1)" : "rgba(255,255,255,0.06)";
  const yTicks = [10000, 20000, 30000, 40000, 50000];

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full h-full">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={stroke} stopOpacity={isLight ? "0.15" : "0.3"} />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map((t) => (
        <line key={t} x1={padX} y1={toY(t)} x2={W - padX} y2={toY(t)} stroke={gridColor} strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={stroke} />)}
      {REVENUE_DATA.map((d, i) => (
        <text key={i} x={toX(i)} y={H + 16} textAnchor="middle" fontSize="10" fill={labelColor}>{d.month}</text>
      ))}
      {yTicks.filter((_, i) => i % 2 === 1).map((t) => (
        <text key={t} x={padX - 6} y={toY(t) + 4} textAnchor="end" fontSize="9" fill={labelColor}>${(t / 1000).toFixed(0)}k</text>
      ))}
    </svg>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const DashboardHome: React.FC = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [theme] = useAtom(themeAtom);
  const [, setPageHeader] = useAtom(pageHeaderAtom);
  const isLight = theme === "light";
  const router = useRouter();

  const [dateRange, setDateRange] = useState("30d");

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(DEFAULT_METRICS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSelectedMetrics(JSON.parse(saved).slice(0, MAX_METRICS));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageHeader({
      title: `Welcome back, ${userProfile?.user?.username ?? "Demo"}`,
      subtitle: "Here's what's happening",
    });
    return () => setPageHeader({});
  }, [userProfile?.user?.username, setPageHeader]);

  useEffect(() => {
    if (mounted) localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedMetrics));
  }, [selectedMetrics, mounted]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleMetric = (id: string) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(id)) return prev.filter((m) => m !== id);
      if (prev.length >= MAX_METRICS) return prev;
      return [...prev, id];
    });
  };

  const atMax = selectedMetrics.length >= MAX_METRICS;
  const displayMetrics = METRIC_POOL.filter((m) => selectedMetrics.includes(m.id));

  // Shared card styles
  const contentCardStyle = isLight
    ? { background: "white", borderColor: "rgb(167 139 250 / 0.5)", boxShadow: "0 2px 16px 0 rgb(139 92 246 / 0.08)" }
    : { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)" };

  return (
    <div className="flex flex-col gap-4 p-4" style={{ marginTop: 64 }}>

      {/* ── Controls row ── */}
      <div className="flex items-center justify-end gap-2">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className={`text-xs rounded-lg border px-3 py-1.5 cursor-pointer outline-none ${
            isLight
              ? "border-purple-200 bg-white text-gray-700 hover:border-purple-400"
              : "border-purple-300/30 bg-white/10 text-white hover:border-purple-400"
          }`}
        >
          {DATE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowPicker((s) => !s)}
            className={`flex items-center gap-1.5 text-xs rounded-lg border px-3 py-1.5 cursor-pointer transition-colors ${
              isLight
                ? "border-purple-200 bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                : "border-purple-300/30 bg-white/5 text-white/60 hover:bg-purple-500/20 hover:text-white"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Customize
          </button>

          {showPicker && (
            <div
              className={`absolute right-0 top-full mt-2 w-60 rounded-xl border shadow-xl z-50 py-2 ${
                isLight ? "bg-white border-purple-200" : "bg-[#1a1a2e] border-purple-300/30"
              }`}
            >
              <div className="flex items-center justify-between px-4 pb-2 pt-1">
                <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-gray-500" : "text-purple-300/80"}`}>
                  Visible metrics
                </p>
                <p className={`text-xs ${atMax ? "text-amber-500 font-medium" : isLight ? "text-gray-400" : "text-white/40"}`}>
                  {selectedMetrics.length}/{MAX_METRICS}
                </p>
              </div>
              {METRIC_POOL.map((m) => {
                const checked = selectedMetrics.includes(m.id);
                const disabled = !checked && atMax;
                return (
                  <button
                    key={m.id}
                    onClick={() => !disabled && toggleMetric(m.id)}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                      disabled
                        ? isLight ? "text-gray-300 cursor-not-allowed" : "text-white/25 cursor-not-allowed"
                        : isLight ? "text-gray-700 hover:bg-purple-50 cursor-pointer" : "text-white hover:bg-purple-500/20 cursor-pointer"
                    }`}
                  >
                    <span>{m.title}</span>
                    <span className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                      checked
                        ? "bg-purple-600 border-purple-600"
                        : disabled
                          ? isLight ? "border-gray-200" : "border-purple-300/20"
                          : isLight ? "border-gray-300" : "border-purple-300/40"
                    }`}>
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
              {atMax && (
                <p className={`px-4 pt-2 pb-1 text-xs ${isLight ? "text-gray-400" : "text-white/35"}`}>
                  Uncheck one to swap in another
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 1: Stat boxes ── */}
      <div className="grid grid-cols-4 gap-3">
        {displayMetrics.map((stat) => (
          <Card
            key={stat.id}
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
              <div className={`text-sm mt-2 flex items-center gap-1 ${
                stat.trend === "up"
                  ? isLight ? "text-green-700" : "text-green-400"
                  : stat.trend === "down"
                    ? isLight ? "text-red-700" : "text-red-400"
                    : isLight ? "text-amber-700" : "text-yellow-400"
              }`}>
                {stat.trend === "up"   && <TrendingUp   className="h-4 w-4" />}
                {stat.trend === "down" && <TrendingDown className="h-4 w-4" />}
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Row 2: Revenue chart + Map ── */}
      <div className="grid grid-cols-2 gap-3" style={{ height: 320 }}>
        <Card className="border flex flex-col overflow-hidden" style={contentCardStyle}>
          <CardHeader className="pb-1 flex-none">
            <CardTitle className={`text-sm font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 px-4 pb-3">
            <RevenueChart isLight={isLight} />
          </CardContent>
        </Card>

        <Card className="border overflow-hidden p-0" style={contentCardStyle}>
          <div className="flex items-center justify-between px-4 py-2 flex-none">
            <span className={`text-sm font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>
              Wells &amp; Deeds
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className={`flex items-center gap-1 ${isLight ? "text-gray-600" : "text-white/60"}`}>
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Wells
              </span>
              <span className={`flex items-center gap-1 ${isLight ? "text-gray-600" : "text-white/60"}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Deeds
              </span>
            </div>
          </div>
          <div className="relative h-[calc(100%-40px)]">
            <MapComponent isLight={isLight} />
            <div
              className="absolute top-0 left-0 right-0 h-6 pointer-events-none z-10"
              style={{
                background: isLight
                  ? "linear-gradient(to bottom, rgba(255,255,255,0.85), transparent)"
                  : "linear-gradient(to bottom, rgba(15,10,30,0.75), transparent)",
              }}
            />
          </div>
        </Card>
      </div>

      {/* ── Row 3: Alerts + Quick Access ── */}
      <div className="grid grid-cols-2 gap-3" style={{ height: 260 }}>

        <Card className="border flex flex-col overflow-hidden" style={contentCardStyle}>
          <CardHeader className="pb-1 flex-none">
            <CardTitle className={`text-sm font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 space-y-2">
            {alerts.map((alert, idx) => {
              const Icon = alert.icon;
              return (
                <button
                  key={idx}
                  onClick={() => router.push(alert.route)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isLight
                      ? "bg-purple-50 border border-purple-100 hover:bg-purple-100"
                      : "bg-white/5 border border-white/5 hover:bg-purple-500/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${alert.iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium leading-tight ${isLight ? "text-gray-900" : "text-white"}`}>
                        {alert.title}
                      </p>
                      <p className={`text-xs ${isLight ? "text-gray-500" : "text-white/50"}`}>
                        {alert.detail}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 ml-2">
                    {alert.amount && (
                      <span className={`text-sm font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>
                        {alert.amount}
                      </span>
                    )}
                    <span className={`text-xs flex items-center gap-0.5 ${isLight ? "text-gray-400" : "text-white/40"}`}>
                      <Clock className="h-3 w-3" />
                      {alert.time}
                    </span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border flex flex-col overflow-hidden" style={contentCardStyle}>
          <CardHeader className="pb-1 flex-none">
            <CardTitle className={`text-sm font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 flex flex-col gap-2">
            {quickAccess.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Button
                  key={idx}
                  variant="ghost"
                  onClick={() => router.push(action.route)}
                  className={`w-full justify-start gap-3 h-10 cursor-pointer border transition-colors ${
                    isLight
                      ? "bg-purple-50 border-purple-200 text-gray-800 hover:bg-purple-100 hover:text-purple-900"
                      : "bg-white/5 border-white/10 text-white hover:bg-purple-500/20"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isLight ? "bg-purple-100 text-purple-700" : "bg-purple-500/20 text-purple-300"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              );
            })}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DashboardHome;
