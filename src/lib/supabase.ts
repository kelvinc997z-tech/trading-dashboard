import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Bucket name untuk trading-dashboard storage
 * Update sesuai bucket yang dibuat di Supabase
 */
export const STORAGE_BUCKET = 'supabase-bronze-coin';

/**
 * Custom type definitions untuk Supabase Storage responses
 * (Supabase JS client doesn't export these types directly)
 */
export interface StorageFile {
  name: string;
  id: string | null; // Supabase returns null for id in some cases
  bucket_id: string | undefined; // Supabase returns undefined in some versions
  created_at: string;
  last_modified?: string; // optional - may not exist in all versions
  metadata?: {
    size?: number;
    mimetype?: string;
    [key: string]: any;
  };
  [key: string]: any; // allow other properties
}

export interface UploadResult {
  path: string;
  fullPath: string;
  name: string;
}

/**
 * Client untuk akses client-side (gunakan di komponen React)
 * Hanya dengan anon key - RLS policy di Supabase harus di-setup
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Client untuk akses server-side (gunakan di API routes)
 * Dengan service role key, bypass RLS policies
 */
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Storage helper functions
export const storage = {
  /**
   * Upload file ke storage bucket
   * @param file - File object dari input
   * @param path - Path relatif di bucket (e.g., 'screenshots/trade-123.png')
   * @param useAdmin - Gunakan admin client (bypass RLS)
   */
  async upload(file: File, path: string, useAdmin: boolean = true): Promise<UploadResult> {
    const client = useAdmin ? supabaseAdmin : supabase;
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}.${fileExt}`;

    const { data, error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    return {
      path: data.path,
      fullPath: data.path,
      name: file.name
    };
  },

  /**
   * Get public URL untuk file di storage
   * @param path - Path file di bucket
   */
  getPublicUrl(path: string): string {
    const { data } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * List semua file di bucket (server-side only)
   */
  async list(path: string = ''): Promise<StorageFile[]> {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .list(path, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) throw error;
    return data || [];
  },

  /**
   * Delete file dari bucket
   */
  async delete(path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) throw error;
  }
};
