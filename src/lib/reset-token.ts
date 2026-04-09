import crypto from 'crypto';

// ──────────────────────────────────────────────────────────────
// Stateless password-reset token utility
// Uses HMAC signatures – NO database table required.
//
// Flow:
//   1. forgot-password generates a token + HMAC sig
//   2. link is emailed: ?reset=true&email=…&token=…&expires=…&sig=…
//   3. reset-password verifies HMAC, checks expiry, updates password
// ──────────────────────────────────────────────────────────────

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function getSecret(): string {
  // Prefer a dedicated secret; fall back to common env vars
  return (
    process.env.RESET_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'agentbot-default-reset-secret-change-in-production'
  );
}

export interface ResetTokenPayload {
  email: string;
  token: string;
  expires: number; // epoch ms
  sig: string;
}

/**
 * Generate a signed reset token payload.
 * Returns the payload that should be embedded in the email link.
 */
export function generateResetToken(email: string): ResetTokenPayload {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + RESET_TOKEN_EXPIRY_MS;
  const data = `${email.toLowerCase()}|${token}|${expires}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('hex');

  return { email: email.toLowerCase(), token, expires, sig };
}

/**
 * Verify a reset token payload.
 * Returns true if the signature is valid and token has not expired.
 */
export function verifyResetToken(payload: ResetTokenPayload): boolean {
  // Check expiry first
  if (Date.now() > payload.expires) {
    return false;
  }

  const data = `${payload.email.toLowerCase()}|${payload.token}|${payload.expires}`;
  const expectedSig = crypto.createHmac('sha256', getSecret()).update(data).digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(payload.sig, 'hex'),
    Buffer.from(expectedSig, 'hex'),
  );
}
