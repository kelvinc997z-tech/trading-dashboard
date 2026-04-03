"use client";

interface ChartSkeletonProps {
  className?: string;
}

export default function ChartSkeleton({ className = "" }: ChartSkeletonProps) {
  return (
    <div className={`skeleton ${className}`} />
  );
}
