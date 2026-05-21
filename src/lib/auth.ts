/**
 * Helper functions for admin authentication and session management.
 * Uses Web Crypto API which is compatible with Cloudflare Workers.
 */

// Simple constant-time comparison for passwords
export async function verifyPassword(env: any, password: string): Promise<boolean> {
  const adminPassword = env.ADMIN_PASSWORD;
  if (!adminPassword || !password) return false;
  
  // Use Web Crypto API to avoid timing attacks
  const encoder = new TextEncoder();
  const a = encoder.encode(adminPassword);
  const b = encoder.encode(password);
  
  if (a.length !== b.length) return false;
  
  // crypto.subtle is available in Cloudflare Workers
  const key = await crypto.subtle.importKey('raw', a, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigA = await crypto.subtle.sign('HMAC', key, a);
  const sigB = await crypto.subtle.sign('HMAC', key, b);
  
  const bufA = new Uint8Array(sigA);
  const bufB = new Uint8Array(sigB);
  
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

// Generate a signed session token
export async function createSessionToken(env: any): Promise<string> {
  const secret = env.ADMIN_SECRET || 'fallback-secret-for-dev-only-do-not-use-in-prod';
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
    
    const secret = env.ADMIN_SECRET || 'fallback-secret-for-dev-only-do-not-use-in-prod';
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
