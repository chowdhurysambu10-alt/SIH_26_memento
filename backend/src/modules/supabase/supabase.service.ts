import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseAdmin: SupabaseClient;
  private supabaseUrl: string;
  private anonKey: string;
  private serviceRoleKey: string;
  private storageBucket: string;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('supabase.url');
    this.anonKey = this.configService.get<string>('supabase.anonKey');
    this.serviceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');
    this.storageBucket = this.configService.get<string>('supabase.storageBucket');

    this.supabaseAdmin = createClient(this.supabaseUrl, this.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async onModuleInit() {
    this.logger.log(`Supabase Client initialized with URL: ${this.supabaseUrl}`);
    await this.ensureStorageBucket();
  }

  /**
   * Returns administrative Supabase client (Bypasses RLS).
   */
  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }

  /**
   * Returns public Supabase client for authentication operations.
   */
  getAnonClient(): SupabaseClient {
    return createClient(this.supabaseUrl, this.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Returns a Supabase client scoped to the provided User Bearer Token (Respects Postgres RLS).
   */
  getUserClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Helper to ensure the storage bucket exists.
   */
  private async ensureStorageBucket(): Promise<void> {
    try {
      const { data: buckets } = await this.supabaseAdmin.storage.listBuckets();
      const exists = buckets?.some((b) => b.name === this.storageBucket);
      if (!exists) {
        await this.supabaseAdmin.storage.createBucket(this.storageBucket, {
          public: true,
          fileSizeLimit: 10485760, // 10MB limit
        });
        this.logger.log(`Created Supabase storage bucket: ${this.storageBucket}`);
      }
    } catch (err) {
      this.logger.warn(`Storage bucket initialization notice: ${err.message}`);
    }
  }

  /**
   * Upload file to Supabase Storage bucket.
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<{ url: string; path: string }> {
    const safeName = (fileName || 'image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `challenges/${Date.now()}_${safeName}`;
    const { data, error } = await this.supabaseAdmin.storage
      .from(this.storageBucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      this.logger.error(`Failed to upload file to Supabase Storage: ${error.message}`);
      throw error;
    }

    const { data: publicUrlData } = this.supabaseAdmin.storage
      .from(this.storageBucket)
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      path: filePath,
    };
  }

  /**
   * Extracts the bucket-relative file path from a storage URL or raw path.
   */
  extractStoragePath(urlOrPath: string): string | null {
    if (!urlOrPath || typeof urlOrPath !== 'string') return null;
    if (urlOrPath.startsWith('data:')) return null; // Base64 data URI

    // Case 1: Full Supabase Storage URL
    // e.g. https://<project>.supabase.co/storage/v1/object/public/challenge-media/challenges/123_photo.webp
    const marker = `/${this.storageBucket}/`;
    const idx = urlOrPath.indexOf(marker);
    if (idx !== -1) {
      const rawPath = urlOrPath.substring(idx + marker.length).split('?')[0];
      return decodeURIComponent(rawPath);
    }

    // Case 2: Relative path starting with "challenges/"
    if (urlOrPath.startsWith('challenges/')) {
      return decodeURIComponent(urlOrPath.split('?')[0]);
    }

    // Case 3: Path starting with bucket name e.g. "challenge-media/challenges/..."
    if (urlOrPath.startsWith(`${this.storageBucket}/`)) {
      return decodeURIComponent(
        urlOrPath.substring(this.storageBucket.length + 1).split('?')[0],
      );
    }

    return null;
  }

  /**
   * Delete one or more files from Supabase Storage bucket by their storage paths.
   */
  async deleteFiles(filePaths: string[]): Promise<number> {
    if (!filePaths || filePaths.length === 0) return 0;
    try {
      const { data, error } = await this.supabaseAdmin.storage
        .from(this.storageBucket)
        .remove(filePaths);

      if (error) {
        this.logger.error(`Failed to delete files from Supabase Storage: ${error.message}`);
        return 0;
      }

      this.logger.log(
        `Successfully deleted ${filePaths.length} file(s) from Supabase Storage: ${filePaths.join(', ')}`,
      );
      return filePaths.length;
    } catch (err: any) {
      this.logger.warn(`Storage file removal notice: ${err.message}`);
      return 0;
    }
  }

  /**
   * Delete files from Supabase Storage bucket given their public URLs.
   */
  async deleteFilesByUrls(urls: string[]): Promise<number> {
    if (!urls || urls.length === 0) return 0;
    const paths = urls
      .map((u) => this.extractStoragePath(u))
      .filter((p): p is string => Boolean(p));

    if (paths.length === 0) return 0;
    return this.deleteFiles(paths);
  }
}
