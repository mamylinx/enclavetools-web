/**
 * Helper functions for admin authentication and session management.
 * Uses Web Crypto API which is compatible with Cloudflare Workers.
 */

// Constant-time comparison for passwords
export async function verifyPassword(env: any, password: string): Promise<boolean> {
  const adminPassword = env.ADMIN_PASSWORD;
  if (!adminPassword || !password) return false;
  
  const encoder = new TextEncoder();
  const a = encoder.encode(adminPassword);
  const b = encoder.encode(password);
  
  const maxLen = Math.max(a.length, b.length);
  const paddedA = new Uint8Array(maxLen);
  const paddedB = new Uint8Array(maxLen);
  paddedA.set(a);
  paddedB.set(b);
  
  const key = await crypto.subtle.importKey('raw', paddedA, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigA = await crypto.subtle.sign('HMAC', key, paddedA);
  const sigB = await crypto.subtle.sign('HMAC', key, paddedB);
  
  const bufA = new Uint8Array(sigA);
  const bufB = new Uint8Array(sigB);
  
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

function requireSecret(env: any): string {
  if (!env.ADMIN_SECRET) {
    throw new Error("ADMIN_SECRET env var is not set");
  }
  return env.ADMIN_SECRET;
}

// Generate a signed session token
export async function createSessionToken(env: any): Promise<string> {
  const secret = requireSecret(env);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', 
    encoder.encode(secret), 
    { name: 'HMAC', hash: 'SHA-256' }, 
    false, 
    ['sign']
  );
  
  const payload = btoa(JSON.stringify({ 
    admin: true, 
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours 
  }));
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${payload}.${sigBase64}`;
}

// Verify a session token
export async function verifySessionToken(env: any, token: string): Promise<boolean> {
  if (!token) return false;
  
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [payloadBase64, sigBase64] = parts;
  
  try {
    const payload = JSON.parse(atob(payloadBase64));
    if (payload.exp < Date.now()) return false; // Expired
    
    const secret = requireSecret(env);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', 
      encoder.encode(secret), 
      { name: 'HMAC', hash: 'SHA-256' }, 
      false, 
      ['verify']
    );
    
    // Decode base64 signature
    const binaryString = atob(sigBase64);
    const sigBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      sigBytes[i] = binaryString.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify(
      'HMAC', 
      key, 
      sigBytes, 
      encoder.encode(payloadBase64)
    );
    
    return isValid && payload.admin === true;
  } catch (e) {
    return false;
  }
}
