"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Filter } from "lucide-react";

interface EventItem {
  date: string;
  time: string;
  currency: string;
  event: string;
  impact: "high" | "medium" | "low";
  actual?: string;
  forecast?: string;
  previous?: string;
}

export default function EconomicCalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCurrency, setFilterCurrency] = useState<string>("all");
  const [filterImpact, setFilterImpact] = useState<string>("all");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/finnhub/economic-calendar");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        // Transform Finnhub data
        const mapped: EventItem[] = data.economicCalendar
          .filter((e: any) => e.country && e.event && e.time)
          .map((e: any) => ({
            date: new Date(e.date * 1000).toLocaleDateString(),
            time: new Date(e.date * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            currency: e.country,
            event: e.event,
            impact: e.impact === "high" ? "high" : e.impact === "medium" ? "medium" : "low",
            actual: e.actual,
            forecast: e.forecast,
            previous: e.previous,
          }));
        setEvents(mapped);
      } catch (err) {
        console.error(err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const currencies = [...new Set(events.map((e) => e.currency))].sort();

  const filteredEvents = events.filter((e) => {
    if (filterCurrency !== "all" && e.currency !== filterCurrency) return false;
    if (filterImpact !== "all" && e.impact !== filterImpact) return false;
    return true;
  });

  const impactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Economic Calendar</h1>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
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
            className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          >
            <option value="all">All Impacts</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Impact</th>
                <th className="px-4 py-3">Actual</th>
                <th className="px-4 py-3">Forecast</th>
                <th className="px-4 py-3">Previous</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No events found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((e, i) => (
                  <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">{e.date}</td>
                    <td className="px-4 py-3">{e.time}</td>
                    <td className="px-4 py-3 font-medium">{e.currency}</td>
                    <td className="px-4 py-3">{e.event}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${impactColor(e.impact)}`}>
                        {e.impact}
                      </span>
                    </td>
                    <td className="px-4 py-3">{e.actual ?? "-"}</td>
                    <td className="px-4 py-3">{e.forecast ?? "-"}</td>
                    <td className="px-4 py-3">{e.previous ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}