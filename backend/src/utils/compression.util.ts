import { gzipSync, gunzipSync } from 'zlib';

export class CompressionUtil {
  static compressText(text: string): string {
    if (!text) return text;
    try {
      const buffer = gzipSync(Buffer.from(text, 'utf-8'));
      return 'zlib:' + buffer.toString('base64');
    } catch (e) {
      return text;
    }
  }

  static decompressText(text: string): string {
    if (!text || !text.startsWith('zlib:')) return text;
    try {
      const base64Data = text.substring(5);
      const buffer = Buffer.from(base64Data, 'base64');
      return gunzipSync(buffer).toString('utf-8');
    } catch (e) {
      return text;
    }
  }
}
