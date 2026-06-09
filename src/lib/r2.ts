const MAGIC_BYTES: Record<string, number[]> = {
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
};

async function isValidImage(file: File): Promise<boolean> {
  const expected = MAGIC_BYTES[file.type];
  if (!expected) return false;
  const blob = file.slice(0, expected.length);
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  return expected.every((b, i) => b === bytes[i]);
}

/**
 * Uploads a file to R2
 */
export async function uploadLogo(env: any, key: string, file: File): Promise<void> {
  if (!env || !env.enclavetools_logos) {
    console.warn("LOGOS R2 bucket not bound. Skipping upload.");
    return;
  }
  if (!(await isValidImage(file))) {
    throw new Error("Invalid image file: magic bytes do not match expected format");
  }
  const arrayBuffer = await file.arrayBuffer();
  await env.enclavetools_logos.put(key, arrayBuffer, {
    httpMetadata: { contentType: file.type }
  });
}

/**
 * Copies an object from one key to another in the same R2 bucket
 */
export async function copyLogo(env: any, sourceKey: string, destKey: string): Promise<void> {
  if (!env || !env.enclavetools_logos) return;
  const object = await env.enclavetools_logos.get(sourceKey);
  if (object) {
    await env.enclavetools_logos.put(destKey, object.body, {
      httpMetadata: object.httpMetadata
    });
  }
}

/**
 * Deletes an object from R2
 */
export async function deleteLogo(env: any, key: string): Promise<void> {
  if (!env || !env.enclavetools_logos) return;
  await env.enclavetools_logos.delete(key);
}
