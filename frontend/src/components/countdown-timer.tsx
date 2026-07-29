import { useEffect, useState } from "react";
import { useCountdown } from "@/hooks/use-countdown";

interface Props {
  expiry: Date | string | null | undefined;
  /** Called once when the countdown reaches zero */
  onExpire?: () => void;
}

/**
 * Circular SVG countdown timer.
 * Displays HH:MM:SS inside a shrinking ring.
 * Turns red in the last 10 seconds.
 */
export function CountdownTimer({ expiry, onExpire }: Props) {
  const { formatted, isExpired, hours, minutes, seconds } = useCountdown(expiry);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (isExpired && !fired) {
      setFired(true);
      onExpire?.();
    }
  }, [isExpired, fired, onExpire]);

  if (!expiry) {
    return (
      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
        No Expiry
      </span>
    );
  }

  // Compute fill progress (0–1) based on total seconds remaining
  // We use a fixed 24h max arc for visual display
  const totalRemaining = hours * 3600 + minutes * 60 + seconds;
  const maxSec = 24 * 3600;
  const progress = Math.min(totalRemaining / maxSec, 1);

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * progress;

  const urgent = totalRemaining <= 10 && !isExpired;
  const strokeColor = isExpired ? "#94a3b8" : urgent ? "#ef4444" : "#3b82f6";
  const textColor = isExpired ? "text-slate-400" : urgent ? "text-red-500" : "text-blue-600";
  const bgColor = isExpired ? "bg-slate-50" : urgent ? "bg-red-50" : "bg-blue-50";

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl ${bgColor} transition-colors`}>
      {/* SVG ring */}
      <svg width="48" height="48" className="-rotate-90">
        {/* Background ring */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="4"
        />
        {/* Progress ring */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          style={{ transition: "stroke-dasharray 1s linear, stroke 0.3s" }}
        />
      </svg>

      {/* Time text */}
      <div className="flex flex-col leading-none">
        <span className={`font-mono font-black text-sm ${textColor} transition-colors`}>
          {formatted}
        </span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
          {isExpired ? "Expired" : "Remaining"}
        </span>
      </div>
    </div>
  );
}
