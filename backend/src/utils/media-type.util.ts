/**
 * Utility for sniffing and validating media MIME types based on magic bytes (file signatures)
 * and file extensions, ensuring accurate detection even if clients send incorrect or generic headers.
 */
export class MediaTypeUtil {
  /**
   * Detects the MIME type of a file buffer using magic byte inspection.
   * If magic bytes cannot identify the format, falls back to the filename extension.
   */
  static detectMimeType(buffer?: Buffer, originalFilename?: string): string | null {
    if (buffer && buffer.length >= 4) {
      // 1. JPEG: 0xFF 0xD8 0xFF
      if (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      ) {
        return 'image/jpeg';
      }

      // 2. PNG: 0x89 'P' 'N' 'G' 0x0D 0x0A 0x1A 0x0A
      if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      ) {
        return 'image/png';
      }

      // 3. WebP: 'RIFF' .... 'WEBP'
      if (
        buffer.length >= 12 &&
        buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
        buffer.slice(8, 12).toString('ascii') === 'WEBP'
      ) {
        return 'image/webp';
      }

      // 4. GIF: 'GIF87a' or 'GIF89a'
      if (
        buffer.length >= 6 &&
        buffer.slice(0, 3).toString('ascii') === 'GIF'
      ) {
        return 'image/gif';
      }

      // 5. HEIF / HEIC / AVIF (ISO Base Media File Format - ISOBMFF)
      // Bytes 4-8 are 'ftyp'
      if (
        buffer.length >= 12 &&
        buffer.slice(4, 8).toString('ascii') === 'ftyp'
      ) {
        const majorBrand = buffer.slice(8, 12).toString('ascii').toLowerCase();
        const heicBrands = new Set([
          'heic',
          'heix',
          'hevc',
          'hevx',
          'mif1',
          'msf1',
          'heis',
          'hevs',
          'heim',
          'hevm',
          'miaf',
        ]);

        if (heicBrands.has(majorBrand)) {
          return 'image/heic';
        }

        if (majorBrand === 'avif' || majorBrand === 'avis') {
          return 'image/avif';
        }

        // Check compatible brands in the rest of the ftyp box
        const ftypBoxLength = buffer.readUInt32BE(0);
        const searchLimit = Math.min(buffer.length, Math.max(16, ftypBoxLength));
        for (let offset = 16; offset + 4 <= searchLimit; offset += 4) {
          const compatibleBrand = buffer
            .slice(offset, offset + 4)
            .toString('ascii')
            .toLowerCase();
          if (heicBrands.has(compatibleBrand)) {
            return 'image/heic';
          }
          if (compatibleBrand === 'avif' || compatibleBrand === 'avis') {
            return 'image/avif';
          }
        }

        // Video container brands in ftyp (MP4 / QuickTime MOV)
        const videoBrands = new Set(['qt  ', 'mp41', 'mp42', 'isom', 'iso2']);
        if (videoBrands.has(majorBrand)) {
          return majorBrand === 'qt  ' ? 'video/quicktime' : 'video/mp4';
        }
      }

      // 6. WebM / Matroska video: 0x1A 0x45 0xDF 0xA3
      if (
        buffer.length >= 4 &&
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3
      ) {
        return 'video/webm';
      }
    }

    // Fallback: Infer from file extension if buffer detection inconclusive
    if (originalFilename) {
      const ext = originalFilename.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'heic':
        case 'heif':
          return 'image/heic';
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'webp':
          return 'image/webp';
        case 'gif':
          return 'image/gif';
        case 'mp4':
          return 'video/mp4';
        case 'mov':
          return 'video/quicktime';
        case 'webm':
          return 'video/webm';
      }
    }

    return null;
  }

  /**
   * Checks whether the file is an HEIC or HEIF image.
   */
  static isHeic(buffer?: Buffer, originalFilename?: string, declaredMime?: string): boolean {
    if (declaredMime && (declaredMime === 'image/heic' || declaredMime === 'image/heif')) {
      return true;
    }
    const detected = MediaTypeUtil.detectMimeType(buffer, originalFilename);
    if (detected === 'image/heic' || detected === 'image/heif') {
      return true;
    }
    if (originalFilename) {
      const ext = originalFilename.split('.').pop()?.toLowerCase();
      if (ext === 'heic' || ext === 'heif') {
        return true;
      }
    }
    return false;
  }

  /**
   * Resolves the canonical MIME type, prioritizing verified magic bytes over client-declared headers.
   */
  static resolveEffectiveMimeType(
    buffer?: Buffer,
    declaredMime?: string,
    originalFilename?: string,
  ): string {
    const detected = MediaTypeUtil.detectMimeType(buffer, originalFilename);
    if (detected) {
      return detected;
    }

    if (declaredMime && declaredMime !== 'application/octet-stream' && declaredMime !== '') {
      return declaredMime;
    }

    if (originalFilename) {
      const ext = originalFilename.split('.').pop()?.toLowerCase();
      if (ext === 'heic' || ext === 'heif') return 'image/heic';
      if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
      if (ext === 'png') return 'image/png';
      if (ext === 'webp') return 'image/webp';
      if (ext === 'mp4') return 'video/mp4';
      if (ext === 'mov') return 'video/quicktime';
    }

    return declaredMime || 'application/octet-stream';
  }
}
