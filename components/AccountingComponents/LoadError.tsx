import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadErrorProps {
  /** What failed to load, e.g. "the chart of accounts". */
  what: string;
  message: string;
  onRetry: () => void;
  isLight?: boolean;
  className?: string;
}

export const LoadError = ({ what, message, onRetry, isLight = false, className }: LoadErrorProps) => (
  <div role="alert" className={cn("flex flex-col items-center gap-2 px-4 py-12 text-center", className)}>
    <AlertTriangle className={cn("size-6", isLight ? "text-red-600" : "text-red-300")} />
    <p className={isLight ? "text-gray-800" : "text-white/85"}>Couldn&apos;t load {what}.</p>
    {message && (
      <p className={cn("max-w-xl break-words text-sm", isLight ? "text-red-700" : "text-red-300")}>{message}</p>
    )}
    <Button
      variant="ghost"
      onClick={onRetry}
      className={cn("mt-1 gap-1.5", isLight ? "text-gray-700 hover:bg-gray-100" : "text-white/80 hover:bg-white/10 hover:text-white")}
    >
      <RotateCcw className="size-4" />
      Try again
    </Button>
  </div>
);

export default LoadError;
