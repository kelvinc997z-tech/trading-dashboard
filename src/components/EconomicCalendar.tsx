"use client";

import { useEffect, useState, useMemo } from "react";
import { Calendar, Filter, Clock, AlertCircle } from "lucide-react";

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

interface EconomicCalendarProps {
  maxItems?: number; // optional limit
}

/**
 * Economic Calendar Component
 * Displays economic events with timezone conversion (Asia/Jakarta)
 * Grouped by date with stats and filters
 */
export default function EconomicCalendar({ maxItems }: EconomicCalendarProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filterCurrency, setFilterCurrency] = useState<string>("all");
  const [filterImpact, setFilterImpact] = useState<string>("all");

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

        // Transform to Jakarta timezone (GMT+7)
        const jakartaOffset = 7 * 60; // minutes
        const mapped: EventItem[] = data.economicCalendar
          .filter((e: any) => e.country && e.event && e.time)
          .map((e: any) => {
            const eventDate = new Date(e.date * 1000);
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
          .sort((a, b) => a.timestamp - b.timestamp);

        // Apply maxItems limit if provided
        const limited = maxItems ? mapped.slice(0, maxItems) : mapped;
        setEvents(limited);
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
    const interval = setInterval(fetchEvents, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [maxItems]);

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
        return <Clock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Economic Calendar</h2>
            {lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Currencies</option>
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Impacts</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Events List */}
      {Object.keys(groupedEvents).length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No events match your filters.</p>
        </div>
      ) : (
        Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date} className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {date}
            </h3>
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
                        <span className="font-bold text-gray-900 dark:text-white">{e.currency}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{e.event}</td>
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
  );
}
