// ULID generation — Crockford Base32, 26 characters
// Format: 10 chars timestamp + 16 chars randomness

const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateUlid(): string {
  const now = Date.now();
  let timestamp = "";
  let t = now;
  for (let i = 0; i < 10; i++) {
    timestamp = CROCKFORD_BASE32[t & 31] + timestamp;
    t = Math.floor(t / 32);
  }

  let randomness = "";
  for (let i = 0; i < 16; i++) {
    randomness += CROCKFORD_BASE32[Math.floor(Math.random() * 32)];
  }

  return timestamp + randomness;
}

export function generateTimestamp(): string {
  return new Date().toISOString();
}
