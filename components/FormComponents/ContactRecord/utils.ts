const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

// The BE writes naive UTC (datetime.utcnow(), serialized with no offset) and new Date() would read
// that as local time, so an offset-less value gets a Z. slice(0, 19) drops the microseconds,
// which browsers aren't required to parse.
export const parseTimestamp = (value?: string | null): Date | null => {
  if (!value) return null;
  const ms = Date.parse(HAS_ZONE.test(value) ? value : `${value.slice(0, 19)}Z`);
  return Number.isNaN(ms) ? null : new Date(ms);
};

/** "Mar 4, 2026 2:14 PM" in the viewer's timezone. */
export const formatTimestamp = (value?: string | null): string => {
  const date = parseTimestamp(value);
  if (!date) return "";
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} ${time}`;
};

/** "Oct 2, 2026" */
export const formatDate = (value?: string | null): string =>
  parseTimestamp(value)?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) ?? "";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const formatMoney = (amount: number) => currency.format(amount);

export type Tone = "danger" | "warning" | "info" | "success" | "neutral";

const TONE_DARK: Record<Tone, string> = {
  danger: "bg-red-500/20 text-red-300",
  warning: "bg-yellow-500/20 text-yellow-300",
  info: "bg-blue-500/20 text-blue-300",
  success: "bg-green-500/20 text-green-300",
  neutral: "bg-white/10 text-purple-200",
};

const TONE_LIGHT: Record<Tone, string> = {
  danger: "bg-red-100 text-red-700",
  warning: "bg-yellow-100 text-yellow-800",
  info: "bg-blue-100 text-blue-700",
  success: "bg-green-100 text-green-700",
  neutral: "bg-purple-100 text-purple-700",
};

/** Status pill colours. Picked by theme (like List.tsx) since index.css only covers some of these. */
export const toneClass = (tone: Tone, isLight: boolean) => (isLight ? TONE_LIGHT : TONE_DARK)[tone];

export const SECTION_HEADER = "text-sm font-semibold text-white/90 uppercase tracking-wider";
export const PANEL = "rounded-xl bg-white/5 border border-purple-300/20 px-4 py-3.5";
