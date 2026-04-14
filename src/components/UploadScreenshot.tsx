'use client';

import { useState, useCallback } from 'react';

interface UploadWidgetProps {
  type: 'screenshot' | 'chart' | 'avatar';
  referenceId?: string;
  onUpload?: (url: string, path: string) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSizeMB?: number;
  children?: React.ReactNode;
}

/**
 * Upload Widget untuk Supabase Storage
 *
 * Usage:
 * <UploadWidget
 *   type="screenshot"
 *   referenceId={tradeId}
 *   onUpload={(url, path) => setScreenshotUrl(url)}
 * />
 */
export default function UploadWidget({
  type,
  referenceId,
  onUpload,
  onError,
  accept = 'image/png,image/jpeg,image/webp',
  maxSizeMB = 5,
  children
}: UploadWidgetProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > maxSizeMB * 1024 * 1024) {
      onError?.(`File too large. Max ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (referenceId) formData.append('referenceId', referenceId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Show preview
      setPreview(result.url);
      onUpload?.(result.url, result.path);

    } catch (error: any) {
      console.error('Upload error:', error);
      onError?.(error.message);
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  }, [type, referenceId, maxSizeMB, onUpload, onError]);

  return (
    <div className="upload-widget">
      <div className="flex items-center gap-4">
        <label className="cursor-pointer">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </>
            ) : (
              'Upload Screenshot'
            )}
          </span>
        </label>

        {children}
      </div>

      {preview && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Preview:</p>
          <img
            src={preview}
            alt="Uploaded preview"
            className="max-w-xs max-h-40 object-cover rounded-lg border border-gray-700"
          />
          <p className="text-xs text-gray-500 mt-1 break-all">
            {preview}
          </p>
        </div>
      )}

      <style jsx>{`
        .upload-widget {
          @apply p-4 bg-gray-800 rounded-lg;
        }
      `}</style>
    </div>
  );
}

/**
 * Hook untuk upload helper
 */
export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (
    file: File,
    type: string,
    referenceId?: string
  ): Promise<{ url: string; path: string } | null> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (referenceId) formData.append('referenceId', referenceId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      return { url: result.url, path: result.path };

    } catch (err: any) {
      setError(err.message);
      return null;

    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, error };
}
