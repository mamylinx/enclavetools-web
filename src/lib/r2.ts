/**
 * Uploads a file to R2
 */
export async function uploadLogo(env: any, key: string, file: File): Promise<void> {
  if (!env || !env.enclavetools_logos) {
    console.warn("LOGOS R2 bucket not bound. Skipping upload.");
    return;
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
