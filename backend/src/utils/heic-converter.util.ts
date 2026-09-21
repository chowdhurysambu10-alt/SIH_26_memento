import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Multi-tiered HEIC/HEIF converter utility.
 * Normalizes HEIC images into standard JPEG format while preserving visual quality.
 */
export class HeicConverterUtil {
  private static readonly logger = new Logger(HeicConverterUtil.name);

  /**
   * Converts an HEIC/HEIF buffer into a JPEG buffer.
   * Uses heic-convert (WebAssembly libheif-js) as the primary cross-platform engine,
   * with a macOS sips fast-path fallback and sharp fallback.
   */
  static async convertHeicToJpeg(
    inputBuffer: Buffer,
    quality: number = 0.92,
  ): Promise<Buffer> {
    if (!inputBuffer || inputBuffer.length === 0) {
      throw new Error('Empty or invalid buffer provided for HEIC conversion.');
    }

    let lastError: Error | null = null;

    // --- Tier 1: heic-convert (WebAssembly libheif-js) ---
    // Universal support across Linux Docker containers, AWS, Cloud Run, and macOS
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const convert = require('heic-convert');
      const jpegBuffer = await convert({
        buffer: inputBuffer,
        format: 'JPEG',
        quality,
      });
      if (jpegBuffer && Buffer.isBuffer(jpegBuffer) && jpegBuffer.length > 0) {
        return jpegBuffer;
      }
      if (jpegBuffer && jpegBuffer instanceof Uint8Array) {
        return Buffer.from(jpegBuffer);
      }
    } catch (err: any) {
      this.logger.debug(
        `Tier 1 (heic-convert) conversion failed: ${err.message}. Attempting fallback tiers.`,
      );
      lastError = err;
    }

    // --- Tier 2: macOS native sips CLI ---
    // Instantaneous hardware-accelerated conversion on macOS development environments
    if (process.platform === 'darwin' && fs.existsSync('/usr/bin/sips')) {
      const tempId = `heic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const tempInput = path.join(os.tmpdir(), `${tempId}.heic`);
      const tempOutput = path.join(os.tmpdir(), `${tempId}.jpg`);

      try {
        await fs.promises.writeFile(tempInput, inputBuffer);
        await execFileAsync('/usr/bin/sips', [
          '-s',
          'format',
          'jpeg',
          '-s',
          'formatOptions',
          String(Math.round(quality * 100)),
          tempInput,
          '--out',
          tempOutput,
        ]);
        const outputBuffer = await fs.promises.readFile(tempOutput);
        return outputBuffer;
      } catch (sipsErr: any) {
        this.logger.debug(`Tier 2 (macOS sips) conversion failed: ${sipsErr.message}`);
        lastError = sipsErr;
      } finally {
        // Guaranteed cleanup of temp files
        try {
          if (fs.existsSync(tempInput)) await fs.promises.unlink(tempInput);
          if (fs.existsSync(tempOutput)) await fs.promises.unlink(tempOutput);
        } catch (cleanupErr) {
          this.logger.warn(`Failed to clean up temporary HEIC conversion files: ${cleanupErr}`);
        }
      }
    }

    // --- Tier 3: Sharp fallback ---
    // Succeeds if sharp was compiled against custom libvips with libde265 support
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require('sharp');
      const outputBuffer = await sharp(inputBuffer)
        .jpeg({ quality: Math.round(quality * 100) })
        .toBuffer();
      return outputBuffer;
    } catch (sharpErr: any) {
      this.logger.debug(`Tier 3 (sharp) conversion failed: ${sharpErr.message}`);
      lastError = sharpErr;
    }

    throw new Error(
      `Failed to convert HEIC/HEIF image: ${lastError?.message || 'Unsupported format or corrupted image file'}.`,
    );
  }
}
