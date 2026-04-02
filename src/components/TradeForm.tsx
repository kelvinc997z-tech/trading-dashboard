'use client';

import { useState, useEffect } from 'react';
import UploadWidget from '@/components/UploadScreenshot';

interface TradeFormProps {
  trade?: any; // existing trade untuk edit mode
  onSuccess: () => void;
  onCancel?: () => void;
}

/**
 * Form untuk membuat/mengedit Trade dengan screenshot support
 *
 * Usage:
 * <TradeForm onSuccess={refreshTrades} />
 */
export default function TradeForm({ trade, onSuccess, onCancel }: TradeFormProps) {
  const [formData, setFormData] = useState({
    symbol: trade?.symbol || 'BTC',
    side: trade?.side || 'buy',
    entry: trade?.entry || '',
    size: trade?.size || 1,
    stopLoss: trade?.stopLoss || '',
    takeProfit: trade?.takeProfit || '',
    notes: trade?.notes || '',
    tags: trade?.tags || '',
    status: trade?.status || 'open',
    screenshotUrl: trade?.screenshotUrl || ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/trades', {
        method: trade ? 'PUT' : 'POST', // Need to implement PUT in API
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          entry: parseFloat(formData.entry),
          size: parseFloat(formData.size),
          stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
          takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
          date: new Date().toISOString(),
          ...(trade && { id: trade.id }) // for update
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save trade');
      }

      onSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleScreenshotUpload = (url: string, path: string) => {
    setFormData(prev => ({ ...prev, screenshotUrl: url }));
  };

  const handleRemoveScreenshot = async () => {
    if (formData.screenshotUrl) {
      // Extract path dari URL, contoh:
      // https://xxiflnuhuhxbdoxtcpgc.supabase.co/storage/v1/object/public/supabase-bronze-coin/screenshots/trade-123/file.png
      const url = new URL(formData.screenshotUrl);
      const pathSegments = url.pathname.split('/').slice(4); // skip /storage/v1/object/public/bucket
      const path = pathSegments.join('/');

      // Delete dari storage
      try {
        await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Failed to delete screenshot:', err);
      }
    }

    setFormData(prev => ({ ...prev, screenshotUrl: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">
        {trade ? 'Edit Trade' : 'New Trade'}
      </h2>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Symbol
          </label>
          <select
            value={formData.symbol}
            onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
            <option value="XAUT">XAUT</option>
            <option value="XRP">XRP</option>
            <option value="AAPL">AAPL</option>
            <option value="NVDA">NVDA</option>
            <option value="AMD">AMD</option>
            <option value="MSFT">MSFT</option>
            <option value="GOOGL">GOOGL</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Side
          </label>
          <select
            value={formData.side}
            onChange={(e) => setFormData(prev => ({ ...prev, side: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="buy">Buy (Long)</option>
            <option value="sell">Sell (Short)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Entry Price (USD)
          </label>
          <input
            type="number"
            step="any"
            value={formData.entry}
            onChange={(e) => setFormData(prev => ({ ...prev, entry: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Size (units)
          </label>
          <input
            type="number"
            step="any"
            value={formData.size}
            onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Stop Loss (optional)
          </label>
          <input
            type="number"
            step="any"
            value={formData.stopLoss}
            onChange={(e) => setFormData(prev => ({ ...prev, stopLoss: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Take Profit (optional)
          </label>
          <input
            type="number"
            step="any"
            value={formData.takeProfit}
            onChange={(e) => setFormData(prev => ({ ...prev, takeProfit: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="e.g., scalp, swing, high-risk"
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Screenshot Upload */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Screenshot (optional)
          </label>
          <UploadWidget
            type="screenshot"
            referenceId={trade?.id || 'new-trade'}
            onUpload={handleScreenshotUpload}
            onError={(err) => setError(`Upload failed: ${err}`)}
          />

          {formData.screenshotUrl && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Uploaded:</span>
                <button
                  type="button"
                  onClick={handleRemoveScreenshot}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
              <img
                src={formData.screenshotUrl}
                alt="Trade screenshot"
                className="max-w-xs max-h-40 object-cover rounded-lg border border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1 break-all">
                {formData.screenshotUrl}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-700">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : (
            'Save Trade'
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
