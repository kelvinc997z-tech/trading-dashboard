import { supabaseAdmin, STORAGE_BUCKET, StorageFile } from './supabase';

/**
 * Advanced Storage Operations for Trading Dashboard
 */

export const storageAdmin = {
  /**
   * Delete file by path
   */
  async deleteByPath(path: string): Promise<boolean> {
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    return true;
  },

  /**
   * Delete all files in a folder (by referenceId)
   */
  async deleteByPrefix(prefix: string): Promise<string[]> {
    const { data: files, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .list(prefix, { limit: 100 });

    if (error) {
      console.error('List error:', error);
      return [];
    }

    const paths = files.map((f: StorageFile) => f.name);
    if (paths.length > 0) {
      const { error: deleteError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .remove(paths);

      if (deleteError) {
        console.error('Batch delete error:', deleteError);
      }
    }

    return paths;
  },

  /**
   * Get file metadata by path
   */
  async getFile(path: string) {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(path);

    if (error) return null;
    return data;
  },

  /**
   * Move/rename file (copy + delete)
   */
  async move(oldPath: string, newPath: string): Promise<boolean> {
    // Download
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(oldPath);

    if (downloadError) return false;

    // Upload to new location
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(newPath, fileData, { upsert: false });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return false;
    }

    // Delete old file
    await this.deleteByPath(oldPath);
    return true;
  },

  /**
   * Get bucket info (size, file count)
   */
  async getBucketInfo() {
    const { data: files, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .list('', { limit: 1000 });

    if (error) return null;

    const totalSize = files.reduce((acc: number, f: StorageFile) => acc + (f.metadata?.size || 0), 0);
    const fileCount = files.length;

    return {
      fileCount,
      totalSize,
      totalSizeMB: totalSize / (1024 * 1024)
    };
  },

  /**
   * Generate signed URL (for private files)
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }
    return data.signedUrl;
  }
};

export default storageAdmin;
