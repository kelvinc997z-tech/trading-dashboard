import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const prisma = db;

/**
 * GET /api/trades/[id]
 * Get single trade by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trade = await prisma.trade.findUnique({
      where: { id: params.id },
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error(`GET /api/trades/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/trades/[id]
 * Update trade by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const trade = await prisma.trade.update({
      where: { id: params.id },
      data: {
        symbol: body.symbol,
        side: body.side,
        entry: body.entry,
        size: body.size,
        stopLoss: body.stopLoss,
        takeProfit: body.takeProfit,
        pnl: body.pnl,
        pnlPct: body.pnlPct,
        status: body.status,
        exit: body.exit,
        exitDate: body.exitDate ? new Date(body.exitDate) : null,
        notes: body.notes,
        tags: body.tags,
        screenshotUrl: body.screenshotUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(trade);
  } catch (error) {
    console.error(`PUT /api/trades/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trades/[id]
 * Delete trade by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Optional: delete associated screenshot from storage
    const trade = await prisma.trade.findUnique({
      where: { id: params.id },
    });

    if (trade?.screenshotUrl) {
      try {
        // Extract path from URL and delete
        const url = new URL(trade.screenshotUrl);
        const pathSegments = url.pathname.split('/').slice(4);
        const path = pathSegments.join('/');

        await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to delete screenshot:', err);
        // Continue with trade deletion
      }
    }

    await prisma.trade.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/trades/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
