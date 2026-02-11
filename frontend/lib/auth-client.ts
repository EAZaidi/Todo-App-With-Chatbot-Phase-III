/**
 * Better Auth client configuration.
 *
 * Provides client-side authentication methods:
 * - signIn: Sign in with email/password
 * - signUp: Create new account
 * - signOut: Sign out current user
 * - useSession: React hook for session state
 * - getToken: Get JWT token for API requests
 */

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3002",
  plugins: [jwtClient()],
});

// Export authentication methods for use in components
export const { signIn, signUp, signOut, useSession } = authClient;

// Type for JWT token storage
let currentToken: string | null = null;

/**
 * Store JWT token from authentication response.
 *
 * @param token - JWT token string
 */
export function setAuthToken(token: string | null): void {
  currentToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }
}

/**
 * Get current JWT token.
 * First tries localStorage, then falls back to fetching from Better Auth.
 *
 * @returns JWT token string or null
 */
export function getAuthToken(): string | null {
  if (currentToken) {
    return currentToken;
  }
  if (typeof window !== "undefined") {
    currentToken = localStorage.getItem("auth_token");
  }
  return currentToken;
}

/**
 * Fetch fresh JWT token from Better Auth.
 * Use this when you need a guaranteed fresh token.
 *
 * @returns Promise<string | null>
 */
export async function fetchAuthToken(): Promise<string | null> {
  try {
    const result = await authClient.getSession();
    if (result.data?.session) {
      // Try to get token from jwtClient
      const tokenResult = await (authClient as any).token?.();
      if (tokenResult?.data?.token) {
        setAuthToken(tokenResult.data.token);
        return tokenResult.data.token;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear JWT token on sign out.
 */
export function clearAuthToken(): void {
  currentToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}
