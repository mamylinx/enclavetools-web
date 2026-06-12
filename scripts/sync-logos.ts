import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve('public', 'favicons');

async function run() {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true });
  const pngFiles = entries.filter(e => e.isFile() && e.name.endsWith('.png'));

  if (pngFiles.length === 0) {
    console.log("No PNG files found in public/favicons/. Nothing to resize.");
    return;
  }

  let resized = 0;
  let skipped = 0;

  for (const file of pngFiles) {
    const filePath = path.join(PUBLIC_DIR, file.name);

    try {
      const metadata = await sharp(filePath).metadata();

      if (metadata.width === 256 && metadata.height === 256) {
        skipped++;
        continue;
      }

      await sharp(filePath)
        .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(filePath + '.tmp');

      await fs.rename(filePath + '.tmp', filePath);
      resized++;
      console.log(`Resized ${file.name} → 256×256`);
    } catch (err: any) {
      console.error(`Error processing ${file.name}: ${err.message}`);
    }
  }

  console.log(`Done: ${resized} resized, ${skipped} already 256×256`);
}

run().catch(console.error);
