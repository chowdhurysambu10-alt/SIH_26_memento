import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface PlatformSettings {
  maintenanceMode: boolean;
  aiAutoTriage: boolean;
  allowPublicComments: boolean;
  dataRetentionDays: number;
  enforceGeolocation: boolean;
  maxAttachmentSizeMB: number;
  enableCommunityChat: boolean;
  enableEmailService: boolean;
  systemBannerText: string;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  
  private defaultSettings: PlatformSettings = {
    maintenanceMode: false,
    aiAutoTriage: true,
    allowPublicComments: true,
    dataRetentionDays: 365,
    enforceGeolocation: false,
    maxAttachmentSizeMB: 10,
    enableCommunityChat: true,
    enableEmailService: true,
    systemBannerText: '',
  };

  constructor(private readonly supabaseService: SupabaseService) {}

  async getSettings(): Promise<PlatformSettings> {
    const admin = this.supabaseService.getAdminClient();
    try {
      const { data, error } = await admin
        .from('platform_settings')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          return this.defaultSettings; // Row not found
        }
        throw error;
      }
      
      if (data) {
        return {
          maintenanceMode: data.maintenance_mode,
          aiAutoTriage: data.ai_auto_triage,
          allowPublicComments: data.allow_public_comments,
          dataRetentionDays: data.data_retention_days,
          enforceGeolocation: data.enforce_geolocation,
          maxAttachmentSizeMB: data.max_attachment_size_mb,
          enableCommunityChat: data.enable_community_chat,
          enableEmailService: data.enable_email_service,
          systemBannerText: data.system_banner_text || '',
        };
      }
    } catch (err) {
      this.logger.error('Failed to read settings from Supabase', err);
    }
    return this.defaultSettings;
  }

  async updateSettings(updates: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const admin = this.supabaseService.getAdminClient();
    
    // Map camelCase to snake_case
    const dbUpdates: any = {};
    if (updates.maintenanceMode !== undefined) dbUpdates.maintenance_mode = updates.maintenanceMode;
    if (updates.aiAutoTriage !== undefined) dbUpdates.ai_auto_triage = updates.aiAutoTriage;
    if (updates.allowPublicComments !== undefined) dbUpdates.allow_public_comments = updates.allowPublicComments;
    if (updates.dataRetentionDays !== undefined) dbUpdates.data_retention_days = updates.dataRetentionDays;
    if (updates.enforceGeolocation !== undefined) dbUpdates.enforce_geolocation = updates.enforceGeolocation;
    if (updates.maxAttachmentSizeMB !== undefined) dbUpdates.max_attachment_size_mb = updates.maxAttachmentSizeMB;
    if (updates.enableCommunityChat !== undefined) dbUpdates.enable_community_chat = updates.enableCommunityChat;
    if (updates.enableEmailService !== undefined) dbUpdates.enable_email_service = updates.enableEmailService;
    if (updates.systemBannerText !== undefined) dbUpdates.system_banner_text = updates.systemBannerText;

    try {
      const { error } = await admin
        .from('platform_settings')
        .update(dbUpdates)
        .eq('id', 1);

      if (error) throw error;
    } catch (err) {
      this.logger.error('Failed to write settings to Supabase', err);
      throw new InternalServerErrorException('Failed to update settings in database.');
    }
    
    return this.getSettings();
  }
}
