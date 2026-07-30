import {
  AlertTriangle,
  BarChart3,
  CheckSquare,
  CreditCard,
  FileSignature,
  FileText,
  MapPin,
  type LucideIcon,
} from "lucide-react";

// ── Metric pool ──────────────────────────────────────────────────────────────
export type Trend = "up" | "down" | "neutral";
export type MetricData = { value: string; change: string; trend: Trend };

export type SimpleMetric = MetricData & {
  id: string;
  kind: "simple";
  title: string;
};
export type DropdownMetric = {
  id: string;
  kind: "dropdown";
  title: string;
  options: { label: string; value: string; data: MetricData }[];
};
export type LinkMetric = {
  id: string;
  kind: "link";
  title: string;
  icon: LucideIcon;
  label: string;
  route: string;
};
export type Metric = SimpleMetric | DropdownMetric | LinkMetric;

export const METRIC_POOL: Metric[] = [
  {
    id: "totalRevenue",
    kind: "dropdown",
    title: "Total Revenue",
    options: [
      {
        label: "Total",
        value: "total",
        data: { value: "$341,000", change: "+8.2% YoY", trend: "up" },
      },
      {
        label: "By Month",
        value: "month",
        data: { value: "$45,231", change: "+12.5%", trend: "up" },
      },
    ],
  },
  {
    id: "revenueErrors",
    kind: "dropdown",
    title: "Revenue Errors",
    options: [
      {
        label: "By Well",
        value: "well",
        data: { value: "3", change: "Wells flagged", trend: "down" },
      },
      {
        label: "By Operator",
        value: "operator",
        data: { value: "2", change: "Operators flagged", trend: "down" },
      },
    ],
  },
  {
    id: "newActivity",
    kind: "dropdown",
    title: "New Activity",
    options: [
      {
        label: "New Permits",
        value: "permits",
        data: { value: "5", change: "+2 this week", trend: "up" },
      },
      {
        label: "New Rigs",
        value: "rigs",
        data: { value: "2", change: "+1 this month", trend: "up" },
      },
      {
        label: "New Completions",
        value: "completions",
        data: { value: "4", change: "This quarter", trend: "neutral" },
      },
      {
        label: "New Wells",
        value: "wells",
        data: { value: "3", change: "+1 this quarter", trend: "up" },
      },
    ],
  },
  {
    id: "assetHoldings",
    kind: "link",
    title: "Asset Holdings",
    icon: MapPin,
    label: "View on Tracts",
    route: "/Dashboard/tracts",
  },
  {
    id: "pendingChecks",
    kind: "simple",
    title: "Pending Checks",
    value: "23",
    change: "5 require attention",
    trend: "neutral",
  },
  {
    id: "documents",
    kind: "simple",
    title: "Documents",
    value: "142",
    change: "8 uploaded today",
    trend: "neutral",
  },
  {
    id: "upcomingPayments",
    kind: "simple",
    title: "Upcoming Payments",
    value: "$12,450",
    change: "Due this week",
    trend: "down",
  },
  {
    id: "totalWells",
    kind: "simple",
    title: "Total Wells",
    value: "18",
    change: "+2 this quarter",
    trend: "up",
  },
  {
    id: "missingDeeds",
    kind: "simple",
    title: "Missing Deeds",
    value: "7",
    change: "Needs attention",
    trend: "down",
  },
  {
    id: "reports",
    kind: "simple",
    title: "Reports",
    value: "34",
    change: "3 generated today",
    trend: "neutral",
  },
];
export const DEFAULT_METRICS = [
  "totalRevenue",
  "revenueErrors",
  "newActivity",
  "assetHoldings",
];
export const STORAGE_KEY = "mrm-dashboard-metrics";
export const MAX_METRICS = 4;

// ── Date range options ────────────────────────────────────────────────────────
export const DATE_RANGES = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last Quarter", value: "90d" },
  { label: "This Year", value: "1y" },
  { label: "All Time", value: "all" },
];

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alerts = [
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
  {
    icon: AlertTriangle,
    title: "Lease Expiring Soon",
    detail: "Permian Basin — Section 14",
    time: "3 days ago",
    amount: null,
    route: "/Dashboard/DashboardDirectory",
    iconColor: "bg-red-500/20 text-red-400",
  },
];

// ── Quick access ──────────────────────────────────────────────────────────────
export type QuickAccessAction = {
  icon: LucideIcon;
  label: string;
  route: string;
};
export type QuickAccessItem = QuickAccessAction | { split: QuickAccessAction[] };

export const quickAccess: QuickAccessItem[] = [
  {
    icon: CheckSquare,
    label: "Process Revenue Checks",
    route: "/Dashboard/checks",
  },
  {
    icon: CreditCard,
    label: "Process AP Payments",
    route: "/Dashboard/checks",
  },
  {
    split: [
      { icon: FileText, label: "New Lease", route: "/Dashboard/leases" },
      { icon: FileSignature, label: "New Deed", route: "/Dashboard/deeds" },
    ],
  },
  { icon: BarChart3, label: "View Reports", route: "/Dashboard/reports" },
];

// ── Revenue chart data ─────────────────────────────────────────────────────────
export type RevenuePoint = { label: string; value: number };
export type RevenueViewKey = "month" | "year" | "operator";

export const REVENUE_VIEWS: Record<RevenueViewKey, RevenuePoint[]> = {
  month: [
    { label: "Aug", value: 28000 },
    { label: "Sep", value: 34000 },
    { label: "Oct", value: 29500 },
    { label: "Nov", value: 41000 },
    { label: "Dec", value: 37500 },
    { label: "Jan", value: 45231 },
  ],
  year: [
    { label: "2022", value: 210000 },
    { label: "2023", value: 265000 },
    { label: "2024", value: 298000 },
    { label: "2025", value: 341000 },
    { label: "2026", value: 45231 },
  ],
  operator: [
    { label: "Pioneer", value: 125000 },
    { label: "Anadarko", value: 98000 },
    { label: "Conoco", value: 76000 },
    { label: "Devon", value: 54000 },
    { label: "EOG", value: 41000 },
  ],
};

export const REVENUE_VIEW_OPTIONS: { label: string; value: RevenueViewKey }[] = [
  { label: "By Month", value: "month" },
  { label: "By Year", value: "year" },
  { label: "By Operator", value: "operator" },
];
