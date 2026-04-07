import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, STORAGE_BUCKET, StorageFile } from '@/lib/supabase';

/**
 * POST /api/upload - Upload file
 * GET /api/upload - List files
 * DELETE /api/upload?path=... - Delete file
 */

// POST handler (upload)
export async function POST(request: NextRequest) {
  try {
    const admin = supabaseAdmin!;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'screenshot';
    const referenceId = formData.get('referenceId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPEG, WEBP, GIF allowed' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Max 5MB' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = type
      ? `${type}/${referenceId || 'general'}/${timestamp}-${safeFilename}`
      : `${timestamp}-${safeFilename}`;

    const { data, error } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = admin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
      name: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// GET handler (list files)
export async function GET(request: NextRequest) {
  try {
    const admin = supabaseAdmin!;
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    const { data: files, error } = await admin.storage
      .from(STORAGE_BUCKET)
      .list(prefix, { limit, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      files: (files || []).map((f: StorageFile) => ({
        name: f.name,
        path: f.id || f.name,
        size: f.metadata?.size || 0,
        created_at: f.created_at,
        // last_modified may not exist in all Supabase versions - use fallback
        last_modified: (f as any).last_modified || f.created_at
      })),
      count: files?.length || 0
    });

  } catch (error: any) {
    console.error('List error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list files' },
      { status: 500 }
    );
  }
}

// DELETE handler (delete file)
export async function DELETE(request: NextRequest) {
  try {
    const admin = supabaseAdmin!;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    const { error } = await admin.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deleted: [path]
    });

  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}
