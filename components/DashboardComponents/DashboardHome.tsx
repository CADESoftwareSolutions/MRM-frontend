import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Settings, TrendingDown, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { userProfileAtom } from "../../src/atoms/userProfileAtom";
import { themeAtom, pageHeaderAtom } from "../../src/atoms/NavigationAtom";
import { useRouter } from "next/router";
import RevenueChart from "./RevenueChart";
import {
  alerts,
  DATE_RANGES,
  DEFAULT_METRICS,
  MAX_METRICS,
  METRIC_POOL,
  quickAccess,
  REVENUE_VIEWS,
  REVENUE_VIEW_OPTIONS,
  STORAGE_KEY,
  type MetricData,
  type RevenueViewKey,
} from "../utils/dashboardHomeUtils";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

// ── Main component ────────────────────────────────────────────────────────────
const DashboardHome: React.FC = () => {
  const [userProfile] = useAtom(userProfileAtom);
  const [theme] = useAtom(themeAtom);
  const [, setPageHeader] = useAtom(pageHeaderAtom);
  const isLight = theme === "light";
  const router = useRouter();

  const [dateRange, setDateRange] = useState("30d");
  const [revenueView, setRevenueView] = useState<RevenueViewKey>("month");
  const [statDropdowns, setStatDropdowns] = useState<Record<string, string>>(
    {}
  );

  const [selectedMetrics, setSelectedMetrics] =
    useState<string[]>(DEFAULT_METRICS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSelectedMetrics(JSON.parse(saved).slice(0, MAX_METRICS));
    } catch {
      /* ignore */
    }
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
    if (mounted)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedMetrics));
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
  const displayMetrics = selectedMetrics
    .map((id) => METRIC_POOL.find((m) => m.id === id)!)
    .filter(Boolean);

  // Shared card styles
  const contentCardStyle = isLight
    ? {
        background: "white",
        borderColor: "rgb(147 51 234 / 0.5)",
      }
    : {
        background: "rgba(255,255,255,0.09)",
        borderColor: "rgba(255,255,255,0.18)",
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.3)",
      };
  const contentCardShadow = isLight
    ? "shadow-[0_2px_12px_0_rgba(139,92,246,0.08)] hover:shadow-[0_10px_32px_0_rgba(139,92,246,0.22)]"
    : "";

  const statCardStyle = isLight
    ? {
        background: "white",
        borderColor: "rgb(147 51 234 / 0.5)",
      }
    : {
        background:
          "linear-gradient(135deg, rgba(147, 51, 234, 0.22) 0%, rgba(126, 34, 206, 0.22) 100%)",
        borderColor: "rgba(147, 51, 234, 0.4)",
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.3)",
      };
  const statCardShadow = isLight
    ? "shadow-[0_2px_14px_0_rgba(147,51,234,0.12)] hover:shadow-[0_12px_36px_0_rgba(147,51,234,0.3)]"
    : "";

  return (
    <div className="flex flex-col gap-4 p-4" style={{ marginTop: 64 }}>
      {/* ── Controls row ── */}
      <div className="flex items-center justify-end gap-2">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger
            className={`h-4 text-xs w-30 cursor-pointer font-medium ${
              isLight
                ? "bg-white border-purple-200 text-gray-800"
                : "bg-white/10 border-purple-300/30 text-white"
            }`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            className={`z-[9999] ${isLight ? "bg-white border-purple-200" : "bg-[#1a1a2e] border-purple-300/30"}`}
            position="popper"
            sideOffset={4}
          >
            {DATE_RANGES.map((r) => (
              <SelectItem
                key={r.value}
                value={r.value}
                className={`text-xs cursor-pointer font-medium ${
                  isLight
                    ? "text-gray-800 hover:bg-purple-50 focus:bg-purple-50"
                    : "text-white hover:bg-purple-400/30 focus:bg-purple-400/30 data-[highlighted]:bg-purple-400/30"
                }`}
              >
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowPicker((s) => !s)}
            className={`flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg border w-30 h-9 cursor-pointer transition-colors ${
              isLight
                ? "border-purple-200 bg-white text-gray-800 hover:bg-purple-50 hover:text-purple-700"
                : "border-purple-300/30 bg-white/5 text-white/85 hover:bg-purple-500/20 hover:text-white"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Customize
          </button>

          {showPicker && (
            <div
              className={`absolute right-0 top-full mt-2 w-60 rounded-xl border shadow-xl z-50 py-2 ${
                isLight
                  ? "bg-white border-purple-200"
                  : "bg-[#1a1a2e] border-purple-300/30"
              }`}
            >
              <div className="flex items-center justify-between px-4 pb-2 pt-1">
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-gray-700" : "text-purple-200"}`}
                >
                  Visible metrics
                </p>
                <div className="flex items-center gap-2">
                  {selectedMetrics.length > 0 && (
                    <button
                      onClick={() => setSelectedMetrics([])}
                      className={`text-xs font-medium cursor-pointer transition-colors ${isLight ? "text-gray-600 hover:text-red-600" : "text-white/70 hover:text-red-400"}`}
                    >
                      Deselect all
                    </button>
                  )}
                  <p
                    className={`text-xs font-medium ${atMax ? "text-amber-600" : isLight ? "text-gray-600" : "text-white/70"}`}
                  >
                    {selectedMetrics.length}/{MAX_METRICS}
                  </p>
                </div>
              </div>
              {METRIC_POOL.map((m) => {
                const checked = selectedMetrics.includes(m.id);
                const position = selectedMetrics.indexOf(m.id);
                const disabled = !checked && atMax;
                return (
                  <button
                    key={m.id}
                    onClick={() => !disabled && toggleMetric(m.id)}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors ${
                      disabled
                        ? isLight
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-white/50 cursor-not-allowed"
                        : isLight
                          ? "text-gray-800 hover:bg-purple-50 cursor-pointer"
                          : "text-white hover:bg-purple-500/20 cursor-pointer"
                    }`}
                  >
                    <span>{m.title}</span>
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors text-xs font-bold ${
                        checked
                          ? "bg-purple-600 border-purple-600 text-white"
                          : disabled
                            ? isLight
                              ? "border-gray-200"
                              : "border-purple-300/20"
                            : isLight
                              ? "border-gray-300"
                              : "border-purple-300/40"
                      }`}
                    >
                      {checked ? position + 1 : null}
                    </span>
                  </button>
                );
              })}
              {atMax && (
                <p
                  className={`px-4 pt-2 pb-1 text-xs font-medium ${isLight ? "text-gray-600" : "text-white/70"}`}
                >
                  Uncheck one to swap in another
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 1: Stat boxes ── */}
      <div className="grid grid-cols-4 gap-3">
        {displayMetrics.map((stat) => {
          const isLink = stat.kind === "link";
          const isDropdown = stat.kind === "dropdown";
          const selectedValue = isDropdown
            ? (statDropdowns[stat.id] ?? stat.options[0].value)
            : undefined;
          const selectedOption = isDropdown
            ? (stat.options.find((o) => o.value === selectedValue) ??
              stat.options[0])
            : undefined;
          const data: MetricData | undefined = isDropdown
            ? selectedOption!.data
            : isLink
              ? undefined
              : stat;
          const LinkIcon = isLink ? stat.icon : undefined;

          return (
            <Card
              key={stat.id}
              onClick={isLink ? () => router.push(stat.route) : undefined}
              className={`backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden ${statCardShadow} ${isLink ? "cursor-pointer" : ""}`}
              style={statCardStyle}
            >
              <CardHeader className="pb-2 flex-none">
                <CardTitle
                  className={`text-lg font-bold ${isLight ? "text-gray-900" : "text-white"}`}
                >
                  {stat.title}
                </CardTitle>
                {isDropdown && (
                  <CardAction>
                    <Select
                      value={selectedValue}
                      onValueChange={(v) =>
                        setStatDropdowns((prev) => ({
                          ...prev,
                          [stat.id]: v,
                        }))
                      }
                    >
                      <SelectTrigger
                        className={`h-6 text-[10px] font-semibold w-[92px] px-2 cursor-pointer ${
                          isLight
                            ? "bg-white border-purple-200 text-gray-800"
                            : "bg-white/10 border-purple-300/30 text-white"
                        }`}
                      >
                        <SelectValue className="truncate" />
                      </SelectTrigger>
                      <SelectContent
                        className={`z-[9999] ${isLight ? "bg-white border-purple-200" : "bg-[#1a1a2e] border-purple-300/30"}`}
                        position="popper"
                        sideOffset={4}
                      >
                        {stat.options.map((o) => (
                          <SelectItem
                            key={o.value}
                            value={o.value}
                            className={`text-xs font-medium cursor-pointer ${
                              isLight
                                ? "text-gray-800 hover:bg-purple-50 focus:bg-purple-50"
                                : "text-white hover:bg-purple-400/30 focus:bg-purple-400/30 data-[highlighted]:bg-purple-400/30"
                            }`}
                          >
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardAction>
                )}
              </CardHeader>
              {isLink ? (
                <CardContent className="flex-1 flex flex-col items-center justify-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isLight
                        ? "bg-purple-100 text-purple-700"
                        : "bg-purple-500/20 text-purple-300"
                    }`}
                  >
                    {LinkIcon && <LinkIcon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-sm font-medium ${isLight ? "text-purple-700" : "text-purple-300"}`}
                  >
                    {stat.label}
                  </span>
                </CardContent>
              ) : (
                <CardContent>
                  <div
                    className={`text-4xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}
                  >
                    {data!.value}
                  </div>
                  <div
                    className={`text-base font-semibold mt-2 flex items-center gap-1 ${
                      data!.trend === "up"
                        ? isLight
                          ? "text-green-800"
                          : "text-emerald-300"
                        : data!.trend === "down"
                          ? isLight
                            ? "text-red-800"
                            : "text-red-300"
                          : isLight
                            ? "text-amber-800"
                            : "text-amber-200"
                    }`}
                  >
                    {data!.trend === "up" && (
                      <TrendingUp className="h-5 w-5" />
                    )}
                    {data!.trend === "down" && (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    {data!.change}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── Row 2: Revenue chart + Map ── */}
      <div className="grid grid-cols-2 gap-3" style={{ height: 320 }}>
        <Card
          className={`border flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 ${contentCardShadow}`}
          style={contentCardStyle}
        >
          <CardHeader className="pb-1 flex-none">
            <CardTitle
              className={`text-lg font-bold ${isLight ? "text-gray-900" : "text-white"}`}
            >
              Revenue Overview
            </CardTitle>
            <CardAction>
              <Select
                value={revenueView}
                onValueChange={(v) => setRevenueView(v as RevenueViewKey)}
              >
                <SelectTrigger
                  className={`h-7 text-xs font-semibold w-28 cursor-pointer ${
                    isLight
                      ? "bg-white border-purple-200 text-gray-800"
                      : "bg-white/10 border-purple-300/30 text-white"
                  }`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className={`z-[9999] ${isLight ? "bg-white border-purple-200" : "bg-[#1a1a2e] border-purple-300/30"}`}
                  position="popper"
                  sideOffset={4}
                >
                  {REVENUE_VIEW_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className={`text-xs font-medium cursor-pointer ${
                        isLight
                          ? "text-gray-800 hover:bg-purple-50 focus:bg-purple-50"
                          : "text-white hover:bg-purple-400/30 focus:bg-purple-400/30 data-[highlighted]:bg-purple-400/30"
                      }`}
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardAction>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 px-4 pb-3">
            <RevenueChart data={REVENUE_VIEWS[revenueView]} isLight={isLight} />
          </CardContent>
        </Card>

        <Card
          className={`border overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 ${contentCardShadow}`}
          style={contentCardStyle}
        >
          <div className="flex items-center justify-between px-4 py-2 flex-none">
            <span
              className={`text-lg font-bold ${isLight ? "text-gray-900" : "text-white"}`}
            >
              Wells &amp; Deeds
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span
                className={`flex items-center gap-1 font-medium ${isLight ? "text-gray-800" : "text-white/85"}`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />{" "}
                Wells
              </span>
              <span
                className={`flex items-center gap-1 font-medium ${isLight ? "text-gray-800" : "text-white/85"}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{" "}
                Deeds
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
      <div className="grid grid-cols-2 gap-3" style={{ height: 220 }}>
        <Card
          className={`border flex flex-col overflow-hidden py-0 gap-0 transition-all duration-300 hover:-translate-y-1 ${contentCardShadow}`}
          style={contentCardStyle}
        >
          <CardHeader className="px-4 pt-3 pb-0 flex-none">
            <CardTitle
              className={`text-lg font-bold ${isLight ? "text-gray-900" : "text-white"}`}
            >
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 pt-2 pb-2 space-y-2">
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
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${alert.iconColor}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-sm font-semibold leading-tight ${isLight ? "text-gray-900" : "text-white"}`}
                      >
                        {alert.title}
                      </p>
                      <p
                        className={`text-xs font-medium ${isLight ? "text-gray-800" : "text-white/90"}`}
                      >
                        {alert.detail}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 ml-2">
                    {alert.amount && (
                      <span
                        className={`text-base font-bold ${isLight ? "text-gray-900" : "text-white"}`}
                      >
                        {alert.amount}
                      </span>
                    )}
                    <span
                      className={`text-xs font-medium flex items-center gap-0.5 ${isLight ? "text-gray-700" : "text-white/85"}`}
                    >
                      <Clock className="h-3 w-3" />
                      {alert.time}
                    </span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card
          className={`border flex flex-col overflow-hidden py-0 gap-0 transition-all duration-300 hover:-translate-y-1 ${contentCardShadow}`}
          style={contentCardStyle}
        >
          <CardHeader className="px-4 pt-3 pb-0 flex-none">
            <CardTitle
              className={`text-lg font-bold ${isLight ? "text-gray-900" : "text-white"}`}
            >
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 px-4 pt-2 pb-2">
            <div className="grid grid-cols-2 gap-2 h-full">
              {quickAccess.map((action, idx) => {
                if ("split" in action) {
                  return (
                    <div
                      key={idx}
                      className={`w-full h-full flex rounded-md border overflow-hidden ${
                        isLight
                          ? "bg-purple-50 border-purple-200"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      {action.split.map((sub, subIdx) => {
                        const SubIcon = sub.icon;
                        return (
                          <React.Fragment key={sub.label}>
                            {subIdx === 1 && (
                              <div
                                className={`w-px shrink-0 ${isLight ? "bg-purple-200" : "bg-white/10"}`}
                              />
                            )}
                            <button
                              onClick={() => router.push(sub.route)}
                              className={`flex-1 h-full flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                                isLight
                                  ? "text-gray-800 hover:bg-purple-100 hover:text-purple-900"
                                  : "text-white hover:bg-purple-500/20"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                  isLight
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-purple-500/20 text-purple-300"
                                }`}
                              >
                                <SubIcon className="h-3 w-3" />
                              </div>
                              <span className="text-sm font-medium text-center leading-tight">
                                {sub.label}
                              </span>
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                }
                const Icon = action.icon;
                return (
                  <Button
                    key={idx}
                    variant="ghost"
                    onClick={() => router.push(action.route)}
                    className={`w-full h-full flex-col gap-2 cursor-pointer border transition-colors ${
                      isLight
                        ? "bg-purple-50 border-purple-200 text-gray-800 hover:bg-purple-100 hover:text-purple-900"
                        : "bg-white/5 border-white/10 text-white hover:bg-purple-500/20"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isLight
                          ? "bg-purple-100 text-purple-700"
                          : "bg-purple-500/20 text-purple-300"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium text-center leading-tight">
                      {action.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
