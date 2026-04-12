'use client';

import React from 'react';

interface GaugeProps {
  value: number; // 0 to 100
  label: string;
  size?: number;
}

export const TechnicalGauge = ({ value, label, size = 120 }: GaugeProps) => {
  const radius = size * 0.4;
  const stroke = size * 0.08;
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const angle = (normalizedValue / 100) * 180 - 180;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 1.5 }}>
        <svg width={size} height={size}>
          {/* Background Track */}
          <path
            d={`M ${size*0.1} ${size*0.6} A ${radius} ${radius} 0 0 1 ${size*0.9} ${size*0.6}`}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Color Gradient Track */}
          <path
            d={`M ${size*0.1} ${size*0.6} A ${radius} ${radius} 0 0 1 ${size*0.9} ${size*0.6}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(normalizedValue/100) * (Math.PI * radius)} 1000`}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" /> {/* Rose 500 */}
              <stop offset="50%" stopColor="#eab308" /> {/* Yellow 500 */}
              <stop offset="100%" stopColor="#10b981" /> {/* Emerald 500 */}
            </linearGradient>
          </defs>
          
          {/* Needle */}
          <line
            x1={size/2}
            y1={size*0.6}
            x2={size/2 + (radius * 0.8) * Math.cos((angle * Math.PI) / 180)}
            y2={size*0.6 + (radius * 0.8) * Math.sin((angle * Math.PI) / 180)}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={size/2} cy={size*0.6} r="4" fill="white" />
        </svg>
        
        <div className="absolute top-[65%] left-0 right-0 text-center">
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{label}</span>
          <div className="text-sm font-bold text-white">{value.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
};
