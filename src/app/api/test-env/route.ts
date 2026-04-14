export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const key = process.env.MASSIVE_API_KEY;
  const cmcKey = process.env.COINMARKETCAP_API_KEY;
  
  return NextResponse.json({
    massive: key ? `${key.slice(0, 8)}...` : "NOT SET",
    cmc: cmcKey ? `${cmcKey.slice(0, 8)}...` : "NOT SET",
    env: process.env.NODE_ENV,
  });
}
