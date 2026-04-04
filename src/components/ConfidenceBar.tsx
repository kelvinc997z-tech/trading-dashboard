"use client";

interface ConfidenceBarProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

export default function ConfidenceBar({ 
  value, 
  size = "md", 
  showLabel = true, 
  label = "AI Confidence",
  animated = true 
}: ConfidenceBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  // Determine color based on confidence level
  const getColor = (v: number) => {
    if (v >= 80) return "from-emerald-400 to-emerald-500";
    if (v >= 60) return "from-cyan-400 to-cyan-500";
    if (v >= 40) return "from-yellow-400 to-yellow-500";
    return "from-rose-400 to-red-500";
  };

  const heightClass = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  }[size];

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">{label}</span>
          <span className={`font-semibold ${clampedValue >= 60 ? 'text-emerald-500' : clampedValue >= 40 ? 'text-yellow-500' : 'text-rose-500'}`}>
            {clampedValue.toFixed(0)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`h-full bg-gradient-to-r ${getColor(clampedValue)} ${animated ? 'transition-all duration-1000 ease-out' : ''}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
