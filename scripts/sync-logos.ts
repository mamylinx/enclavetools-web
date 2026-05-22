import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';
import toolsData from '../src/data/tools.json' assert { type: 'json' };

dotenv.config();

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = 'enclavetools-logos';
const PUBLIC_DIR = path.resolve('public', 'favicons');

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.warn("⚠️  Skipping logo sync: R2 credentials missing in .env (CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).");
  process.exit(0);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

async function run() {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  const allTools = toolsData.tools.flatMap((cat: any) => cat.content);

  for (const tool of allTools) {
    if (!tool.slug) continue;

    const destPath = path.join(PUBLIC_DIR, `${tool.slug}.png`);
    const exists = await fs.stat(destPath).then(() => true).catch(() => false);

    if (exists) {
      continue;
    }

    console.log(`Downloading missing logo for: ${tool.slug}`);
    
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `approved/${tool.slug}.png`,
      });

      const response = await s3.send(command);
      
      if (response.Body) {
        const byteArray = await response.Body.transformToByteArray();
        
        // Resize and compress with sharp
        await sharp(Buffer.from(byteArray))
          .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png({ compressionLevel: 9 })
          .toFile(destPath);
          
        console.log(`✅ Synced & resized ${tool.slug}.png`);
      }
    } catch (err: any) {
      if (err.name === 'NoSuchKey') {
        console.log(`⚠️  Logo not found in R2 for ${tool.slug} (Key: approved/${tool.slug}.png)`);
      } else {
        console.error(`❌ Error syncing ${tool.slug}:`, err.message);
      }
    }
  }
}

run().catch(console.error);
