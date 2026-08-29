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
    const filePath = `challenges/${Date.now()}_${fileName}`;
    const { data, error } = await this.supabaseAdmin.storage
      .from(this.storageBucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
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
}
