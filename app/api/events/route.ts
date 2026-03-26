import { NextRequest } from "next/server";

// Mark route as dynamic to prevent static rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Get base URL from request headers
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  // Send initial data
  const sendInitial = async () => {
    try {
      const marketRes = await fetch(`${baseUrl}/api/market-data`, {
        next: { revalidate: 0 },
      });
      const marketData = await marketRes.json();

      const signalsRes = await fetch(`${baseUrl}/api/generate-signals`, {
        next: { revalidate: 0 },
      });
      const signalsData = await signalsRes.json();

      writer.write(encoder.encode(`event: markets\ndata: ${JSON.stringify(marketData)}\n\n`));
      writer.write(encoder.encode(`event: signals\ndata: ${JSON.stringify(signalsData)}\n\n`));
    } catch (error) {
      console.error("SSE initial error:", error);
    }
  };

  await sendInitial();

  // Poll every 60 seconds and send updates
  const interval = setInterval(async () => {
    try {
      const marketRes = await fetch(`${baseUrl}/api/market-data`, {
        next: { revalidate: 0 },
      });
      const marketData = await marketRes.json();

      const signalsRes = await fetch(`${baseUrl}/api/generate-signals`, {
        next: { revalidate: 0 },
      });
      const signalsData = await signalsRes.json();

      writer.write(encoder.encode(`event: markets\ndata: ${JSON.stringify(marketData)}\n\n`));
      writer.write(encoder.encode(`event: signals\ndata: ${JSON.stringify(signalsData)}\n\n`));
    } catch (error) {
      console.error("SSE interval error:", error);
    }
  }, 60000);

  // Handle client disconnect
  request.signal.addEventListener("abort", () => {
    clearInterval(interval);
    writer.close();
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
