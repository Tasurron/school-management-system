import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp?: number;
  [key: string]: unknown;
}

/**
 * Decodes a JWT without verifying its signature (verification happens on the backend).
 * Returns null if the token is malformed.
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is missing, malformed, or past its `exp` claim.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const nowInSeconds = Date.now() / 1000;
  return decoded.exp < nowInSeconds;
}
