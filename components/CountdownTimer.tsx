"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: Date;
  onExpire?: () => void;
}

export function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        onExpire?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      <div className="flex flex-col items-center">
        <span className="text-2xl md:text-3xl font-bold text-white">{formatNumber(timeLeft.days)}</span>
        <span className="text-xs text-blue-200 uppercase">Days</span>
      </div>
      <span className="text-2xl font-bold text-blue-300">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl md:text-3xl font-bold text-white">{formatNumber(timeLeft.hours)}</span>
        <span className="text-xs text-blue-200 uppercase">Hours</span>
      </div>
      <span className="text-2xl font-bold text-blue-300">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl md:text-3xl font-bold text-white">{formatNumber(timeLeft.minutes)}</span>
        <span className="text-xs text-blue-200 uppercase">Minutes</span>
      </div>
      <span className="text-2xl font-bold text-blue-300">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl md:text-3xl font-bold text-white">{formatNumber(timeLeft.seconds)}</span>
        <span className="text-xs text-blue-200 uppercase">Seconds</span>
      </div>
    </div>
  );
}
