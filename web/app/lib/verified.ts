// Hardcoded list of verified / official publishers. We trust them by hand —
// migrate to a DB column (users.is_verified) once the list grows.
export const VERIFIED_PUBLISHERS = new Set([
  "modelcontextprotocol",
  "cloudflare",
  "stripe",
  "sourcegraph",
  "Arhaan_admin",
]);

export function isVerified(username: string | null | undefined): boolean {
  if (!username) return false;
  return VERIFIED_PUBLISHERS.has(username);
}
