import crypto from 'crypto';

const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const VERSION_PREFIX = 'v1:';

/** Derives a purpose-bound 256-bit key from the master secret (HKDF-SHA256). */
export function deriveKey(masterSecret: string, purpose: string): Buffer {
  const derived = crypto.hkdfSync(
    'sha256',
    Buffer.from(masterSecret, 'utf8'),
    Buffer.from('mindmittel-v2', 'utf8'),
    Buffer.from(purpose, 'utf8'),
    KEY_BYTES
  );
  return Buffer.from(derived);
}

/** Encrypts a secret with AES-256-GCM. Output: `v1:` + base64url(iv | tag | ciphertext). */
export function encryptSecret(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return VERSION_PREFIX + Buffer.concat([iv, tag, ciphertext]).toString('base64url');
}

/** Decrypts a `v1:` token. Throws if the token was tampered with or the key is wrong. */
export function decryptSecret(token: string, key: Buffer): string {
  if (!token.startsWith(VERSION_PREFIX)) {
    throw new Error('Unsupported secret format');
  }
  const raw = Buffer.from(token.slice(VERSION_PREFIX.length), 'base64url');
  if (raw.length <= IV_BYTES + TAG_BYTES) {
    throw new Error('Secret payload too short');
  }
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
