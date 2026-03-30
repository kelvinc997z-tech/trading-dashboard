import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/export/trades.csv?format=csv
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";

  const trades = await db.trade.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  if (trades.length === 0) {
    return NextResponse.json({ message: "No trades to export" });
  }

  if (format === "json") {
    return NextResponse.json(trades);
  }

  // CSV format
  const headers = ["id", "symbol", "side", "entry", "exit", "stopLoss", "takeProfit", "pnl", "pnlPct", "status", "date", "exitDate", "notes", "tags"];
  const csvRows: string[] = [headers.join(",")];

  for (const trade of trades) {
    const row = headers.map(header => {
      const value = (trade as any)[header];
      if (value === null || value === undefined) return "";
      // Escape quotes and wrap in quotes if contains comma
      const str = String(value);
      if (str.includes(",") || str.includes("\"")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvRows.push(row.join(","));
  }

  const csv = csvRows.join("\n");
  const filename = `trades-export-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
