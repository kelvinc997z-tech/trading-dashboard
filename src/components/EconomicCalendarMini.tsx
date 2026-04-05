"use client";

import { useEffect, useState, useMemo } from "react";
import { Calendar, Clock, AlertCircle, Filter } from "lucide-react";

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

export default function EconomicCalendarMini() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

        // Transform with timezone (Asia/Jakarta = GMT+7)
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
          .sort((a: EventItem, b: EventItem) => a.timestamp - b.timestamp);

        setEvents(mapped);
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

  // Filter to today's events only (local date)
  const todayEvents = useMemo(() => {
    const today = new Date().toLocaleDateString("en-GB");
    return events.filter(e => e.date === today);
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (filterImpact === "all") return todayEvents;
    return todayEvents.filter(e => e.impact === filterImpact);
  }, [todayEvents, filterImpact]);

  const impactBadge = (impact: string) => {
    const styles = {
      high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900",
      low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900",
    };
    return styles[impact as keyof typeof styles] || styles.low;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-muted/50 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-4 w-16 bg-muted-foreground/20 rounded" />
              <div className="h-4 w-12 bg-muted-foreground/20 rounded" />
              <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
              <div className="h-5 w-16 bg-muted-foreground/20 rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-4 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Today's Events</p>
          <p className="text-xl font-bold text-foreground">{todayEvents.length}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">High Impact</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {todayEvents.filter(e => e.impact === "high").length}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Currencies</p>
          <p className="text-xl font-bold text-foreground">
            {[...new Set(todayEvents.map(e => e.currency))].length}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Next Event</p>
          <p className="text-sm font-bold text-foreground">
            {filteredEvents[0]?.time || "-"}
          </p>
        </div>
      </div>

      {/* Filter & List */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-background border-border focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Impacts</option>
            <option value="high">High Impact</option>
            <option value="medium">Medium Impact</option>
            <option value="low">Low Impact</option>
          </select>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No events for today</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredEvents.slice(0, 20).map((event, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition"
              >
                <div className="flex items-center gap-2 w-24">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-sm text-foreground">{event.time}</span>
                </div>
                <div className="w-16">
                  <span className="font-bold text-sm text-foreground">{event.currency}</span>
                </div>
                <div className="flex-1 text-sm text-foreground truncate">{event.event}</div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${impactBadge(event.impact)}`}>
                  {event.impact}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
