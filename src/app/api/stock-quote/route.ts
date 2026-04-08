import { NextRequest, NextResponse } from "next/server";
import { fetchStockQuote } from "@/lib/massive";

// GET /api/stock-quote?symbol=AAPL
// Returns real-time stock quote from Massive.com API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    const quote = await fetchStockQuote(symbol.toUpperCase());

    if (!quote) {
      return NextResponse.json(
        { error: "Failed to fetch quote - check symbol or API configuration" },
        { status: 404 }
      );
    }

    // Normalize response
    const response = {
      symbol: quote.symbol || symbol.toUpperCase(),
      price: Number(quote.price || 0),
      change: Number(quote.change || 0),
      changePercent: Number(quote.changePercent || 0),
      timestamp: quote.timestamp ? new Date(quote.timestamp).toISOString() : new Date().toISOString(),
      source: "Massive.com",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[StockQuote] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stock quote" },
      { status: 500 }
    );
  }
}