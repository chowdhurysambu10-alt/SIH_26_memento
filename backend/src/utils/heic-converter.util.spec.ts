import { HeicConverterUtil } from './heic-converter.util';
import * as fs from 'fs';
import * as path from 'path';

describe('HeicConverterUtil', () => {
  const scratchHeicPath =
    '/Users/sambu/.gemini/antigravity-ide/brain/7b6ea5fc-2f51-4223-9ac7-95e3b5a5f3e9/scratch/test_sample.heic';

  it('should convert a valid HEIC buffer into a JPEG buffer', async () => {
    if (!fs.existsSync(scratchHeicPath)) {
      console.warn('Scratch HEIC test fixture not found, skipping fixture test');
      return;
    }

    const heicBuffer = fs.readFileSync(scratchHeicPath);
    const jpegBuffer = await HeicConverterUtil.convertHeicToJpeg(heicBuffer, 0.9);

    expect(jpegBuffer).toBeDefined();
    expect(jpegBuffer.length).toBeGreaterThan(0);
    // Check JPEG magic bytes: FF D8 FF
    expect(jpegBuffer[0]).toBe(0xff);
    expect(jpegBuffer[1]).toBe(0xd8);
    expect(jpegBuffer[2]).toBe(0xff);
  });

  it('should throw an informative error when given an empty buffer', async () => {
    await expect(
      HeicConverterUtil.convertHeicToJpeg(Buffer.alloc(0)),
    ).rejects.toThrow('Empty or invalid buffer');
  });

  it('should throw an error when given a corrupted buffer without crashing', async () => {
    const corruptedBuffer = Buffer.from('corrupted non-heic bytes with ftyp box ftypheic123456');
    await expect(
      HeicConverterUtil.convertHeicToJpeg(corruptedBuffer),
    ).rejects.toThrow();
  });
});
