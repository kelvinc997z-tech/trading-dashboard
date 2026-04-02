"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, Filter, Clock, TrendingUp, AlertCircle } from "lucide-react";

interface EventItem {
  timestamp: number;
  date: string;
  time: string;
  currency: string;
  event: string;
  impact: "high" | "medium" | "low";
  actual?: string;
  forecast?: string;
  previous?: string;
}

interface GroupedEvents {
  [date: string]: EventItem[];
}

export default function EconomicCalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCurrency, setFilterCurrency] = useState<string>("all");
  const [filterImpact, setFilterImpact] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/finnhub/economic-calendar");
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to fetch economic calendar");
        }
        const data = await res.json();
        
        if (!data.economicCalendar || !Array.isArray(data.economicCalendar)) {
          throw new Error("Invalid data format from Finnhub");
        }

        // Transform Finnhub data with timezone support (Asia/Jakarta = GMT+7)
        const jakartaOffset = 7 * 60; // minutes
        const mapped: EventItem[] = data.economicCalendar
          .filter((e: any) => e.country && e.event && e.time)
          .map((e: any) => {
            const eventDate = new Date(e.date * 1000);
            // Convert to Jakarta timezone
            const jakartaTime = new Date(eventDate.getTime() + jakartaOffset * 60 * 1000);
            
            return {
              timestamp: e.date,
              date: jakartaTime.toLocaleDateString("en-GB", { 
                day: "2-digit", 
                month: "short", 
                year: "numeric" 
              }),
              time: jakartaTime.toLocaleTimeString("en-GB", { 
                hour: "2-digit", 
                minute: "2-digit",
                hour12: false 
              }),
              currency: e.country,
              event: e.event,
              impact: e.impact === "high" ? "high" : e.impact === "medium" ? "medium" : "low",
              actual: e.actual,
              forecast: e.forecast,
              previous: e.previous,
            };
          })
          // Sort by timestamp ascending (nearest first)
          .sort((a: EventItem, b: EventItem) => a.timestamp - b.timestamp);

        setEvents(mapped);
        setLastUpdated(new Date());
      } catch (err: any) {
        console.error("Economic calendar fetch error:", err);
        setError(err.message);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
    // Refresh every 30 minutes
    const interval = setInterval(fetchEvents, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const currencies = useMemo(() => 
    [...new Set(events.map((e) => e.currency))].sort(),
    [events]
  );

  const filteredEvents = useMemo(() => 
    events.filter((e) => {
      if (filterCurrency !== "all" && e.currency !== filterCurrency) return false;
      if (filterImpact !== "all" && e.impact !== filterImpact) return false;
      return true;
    }),
    [events, filterCurrency, filterImpact]
  );

  // Group events by date
  const groupedEvents = useMemo<GroupedEvents>(() => {
    return filteredEvents.reduce((acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = [];
      }
      acc[event.date].push(event);
      return acc;
    }, {} as GroupedEvents);
  }, [filteredEvents]);

  const impactBadge = (impact: string) => {
    const styles = {
      high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900",
      low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900",
    };
    return styles[impact as keyof typeof styles] || styles.low;
  };

  const impactIcon = (impact: string) => {
    switch (impact) {
      case "high":
        return <AlertCircle className="w-3 h-3" />;
      case "medium":
        return <TrendingUp className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-12 bg-gray-100 dark:bg-gray-700 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Failed to load economic calendar</h2>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Economic Calendar</h1>
              {lastUpdated && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
            </div>
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Currencies</option>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filterImpact}
              onChange={(e) => setFilterImpact(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Impacts</option>
              <option value="high">High Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="low">Low Impact</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredEvents.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">High Impact</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {filteredEvents.filter((e) => e.impact === "high").length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Currencies</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{currencies.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredEvents.filter((e) => {
                const today = new Date().toLocaleDateString("en-GB");
                return e.date === today;
              }).length}
            </p>
          </div>
        </div>

        {/* Grouped Events by Date */}
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No events match your filters.</p>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date} className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {date}
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 w-24">Time</th>
                      <th className="px-4 py-3 w-20">Currency</th>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3 w-24">Impact</th>
                      <th className="px-4 py-3 w-20 text-right">Actual</th>
                      <th className="px-4 py-3 w-20 text-right">Forecast</th>
                      <th className="px-4 py-3 w-20 text-right">Previous</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayEvents.map((e, i) => (
                      <tr 
                        key={i} 
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                      >
                        <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">
                          {e.time}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {e.currency}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {e.event}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${impactBadge(e.impact)}`}>
                            {impactIcon(e.impact)}
                            {e.impact}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{e.actual ?? "-"}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">{e.forecast ?? "-"}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">{e.previous ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}