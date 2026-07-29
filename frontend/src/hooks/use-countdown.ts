import { useState, useEffect } from "react";

export interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string; // HH:MM:SS
}

/**
 * Returns a live countdown to the given expiry date.
 * Works correctly across page refreshes — uses the server‑stored
 * absolute timestamp so the countdown never resets.
 */
export function useCountdown(expiry: Date | string | null | undefined): CountdownResult {
  const getRemaining = (): number => {
    if (!expiry) return -1; // no expiry = never expires
    const diff = new Date(expiry).getTime() - Date.now();
    return Math.max(0, diff);
  };

  const [remaining, setRemaining] = useState<number>(getRemaining);

  useEffect(() => {
    if (!expiry) return;
    const interval = setInterval(() => {
      setRemaining(getRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [expiry]);

  const isExpired = expiry != null && remaining === 0;
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatted = expiry
    ? isExpired
      ? "00:00:00"
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : "∞";

  return { hours, minutes, seconds, isExpired, formatted };
}
