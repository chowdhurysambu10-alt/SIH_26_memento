import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface PlatformSettings {
  maintenanceMode: boolean;
  aiAutoTriage: boolean;
  allowPublicComments: boolean;
  dataRetentionDays: number;
  enforceGeolocation: boolean;
  maxAttachmentSizeMB: number;
  enableCommunityChat: boolean;
  systemBannerText: string;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly settingsPath = path.join(process.cwd(), 'platform-settings.json');
  
  private defaultSettings: PlatformSettings = {
    maintenanceMode: false,
    aiAutoTriage: true,
    allowPublicComments: true,
    dataRetentionDays: 365,
    enforceGeolocation: false,
    maxAttachmentSizeMB: 10,
    enableCommunityChat: true,
    systemBannerText: '',
  };

  getSettings(): PlatformSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      this.logger.error('Failed to read settings', err);
    }
    return this.defaultSettings;
  }

  updateSettings(updates: Partial<PlatformSettings>): PlatformSettings {
    const current = this.getSettings();
    const merged = { ...current, ...updates };
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(merged, null, 2));
    } catch (err) {
      this.logger.error('Failed to write settings', err);
    }
    return merged;
  }
}
