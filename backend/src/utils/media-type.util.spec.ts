import { MediaTypeUtil } from './media-type.util';

describe('MediaTypeUtil', () => {
  it('should detect JPEG from magic bytes', () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(MediaTypeUtil.detectMimeType(jpegHeader)).toBe('image/jpeg');
  });

  it('should detect PNG from magic bytes', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(MediaTypeUtil.detectMimeType(pngHeader)).toBe('image/png');
  });

  it('should detect WebP from magic bytes', () => {
    const webpHeader = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('WEBP', 'ascii'),
    ]);
    expect(MediaTypeUtil.detectMimeType(webpHeader)).toBe('image/webp');
  });

  it('should detect HEIC with major brand heic', () => {
    // 4 bytes length, 'ftyp', 'heic'
    const heicHeader = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x18]),
      Buffer.from('ftyp', 'ascii'),
      Buffer.from('heic', 'ascii'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('mif1', 'ascii'),
    ]);
    expect(MediaTypeUtil.detectMimeType(heicHeader)).toBe('image/heic');
    expect(MediaTypeUtil.isHeic(heicHeader)).toBe(true);
  });

  it('should detect HEIC with compatible brand mif1 in ftyp box', () => {
    const heifHeader = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x1c]),
      Buffer.from('ftyp', 'ascii'),
      Buffer.from('mp42', 'ascii'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('mif1', 'ascii'),
      Buffer.from('heic', 'ascii'),
    ]);
    expect(MediaTypeUtil.detectMimeType(heifHeader)).toBe('image/heic');
    expect(MediaTypeUtil.isHeic(heifHeader)).toBe(true);
  });

  it('should detect MP4 video from ftyp box', () => {
    const mp4Header = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x18]),
      Buffer.from('ftyp', 'ascii'),
      Buffer.from('isom', 'ascii'),
      Buffer.from([0x00, 0x00, 0x02, 0x00]),
      Buffer.from('mp41', 'ascii'),
    ]);
    expect(MediaTypeUtil.detectMimeType(mp4Header)).toBe('video/mp4');
  });

  it('should fall back to filename extension for unrecognized bytes', () => {
    const unknownBytes = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    expect(MediaTypeUtil.detectMimeType(unknownBytes, 'photo.heic')).toBe('image/heic');
    expect(MediaTypeUtil.detectMimeType(unknownBytes, 'photo.jpg')).toBe('image/jpeg');
    expect(MediaTypeUtil.detectMimeType(unknownBytes, 'photo.png')).toBe('image/png');
  });

  it('should correctly resolve effective MIME type when client sends generic application/octet-stream', () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const resolved = MediaTypeUtil.resolveEffectiveMimeType(
      jpegHeader,
      'application/octet-stream',
      'IMG_4901.heic',
    );
    // Magic bytes take precedence over incorrect filename/generic mime
    expect(resolved).toBe('image/jpeg');
  });
});
