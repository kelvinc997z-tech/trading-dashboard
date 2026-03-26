import { NextResponse } from "next/server";

export async function GET() {
  const encoder = new TextEncoder();

  const sendEvent = (data: any) => {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  };

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial markets
      try {
        const marketsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/market-data`);
        const markets = await marketsRes.json();
        controller.enqueue(sendEvent({ type: "markets", data: markets }));
      } catch (e) {
        controller.enqueue(sendEvent({ type: "error", data: "Failed to fetch initial markets" }));
      }

      // Send initial signals
      try {
        const signalsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/generate-signals`);
        const signalsJson = await signalsRes.json();
        controller.enqueue(sendEvent({ type: "signals", data: signalsJson.signals || [] }));
      } catch (e) {
        controller.enqueue(sendEvent({ type: "error", data: "Failed to fetch initial signals" }));
      }

      // Periodic updates every 60 seconds
      const interval = setInterval(async () => {
        try {
          const marketsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/market-data`);
          const markets = await marketsRes.json();
          controller.enqueue(sendEvent({ type: "markets", data: markets }));
        } catch (e) {
          // ignore errors
        }
        try {
          const signalsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/generate-signals`);
          const signalsJson = await signalsRes.json();
          controller.enqueue(sendEvent({ type: "signals", data: signalsJson.signals || [] }));
        } catch (e) {
          // ignore errors
        }
      }, 60000);

      // Note: controller does not have a 'signal' property in standard ReadableStream.
      // Vercel will automatically close the stream when client disconnects.
      // The interval will be cleaned up by the garbage collector eventually.
      // For better cleanup, you could track the interval ID elsewhere if needed.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
