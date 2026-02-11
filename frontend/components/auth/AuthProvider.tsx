"use client";

/**
 * Authentication context provider for the application.
 *
 * Provides authentication state and methods to all child components:
 * - user: Current authenticated user or null
 * - isLoading: Authentication state loading indicator
 * - token: Current JWT token for API requests
 * - signIn/signUp/signOut: Authentication methods
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  authClient,
  useSession,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from "@/lib/auth-client";
import { setUserId } from "@/lib/api/client";

interface User {
  id: string;
  email: string;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [checkedStorage, setCheckedStorage] = useState(false);

  // Initialize token from storage on mount
  useEffect(() => {
    const storedToken = getAuthToken();
    if (storedToken) {
      setToken(storedToken);
    }
    setCheckedStorage(true);
  }, []);

  // Update token and user ID when session changes
  useEffect(() => {
    if (session?.user) {
      // Token is managed by the auth client
      const currentToken = getAuthToken();
      setToken(currentToken);
      // Store user ID for API requests
      setUserId(session.user.id);
    } else if (!isPending && !session) {
      clearAuthToken();
      setToken(null);
      setUserId(null);
    }
  }, [session, isPending]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      throw new Error(result.error.message || "Sign in failed");
    }

    // Store user ID
    if (result.data?.user?.id) {
      setUserId(result.data.user.id);
    }

    // Fetch JWT token from the token endpoint after sign-in (non-blocking)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const tokenResponse = await fetch("/api/auth/token", {
        method: "GET",
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        if (tokenData.token) {
          setAuthToken(tokenData.token);
          setToken(tokenData.token);
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error("Failed to fetch JWT token:", e);
    }
  }, []);

  const handleSignUp = useCallback(
    async (email: string, password: string, name?: string) => {
      const result = await authClient.signUp.email({
        email,
        password,
        name: name || email.split("@")[0],
      });

      if (result.error) {
        throw new Error(result.error.message || "Sign up failed");
      }

      // Store user ID
      if (result.data?.user?.id) {
        setUserId(result.data.user.id);
      }

      // Fetch JWT token from the token endpoint after sign-up (non-blocking)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const tokenResponse = await fetch("/api/auth/token", {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          if (tokenData.token) {
            setAuthToken(tokenData.token);
            setToken(tokenData.token);
          }
        }
      } catch (e) {
        clearTimeout(timeoutId);
        console.error("Failed to fetch JWT token:", e);
      }
    },
    []
  );

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    clearAuthToken();
    setToken(null);
    setUserId(null);
  }, []);

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        createdAt: new Date(session.user.createdAt),
        updatedAt: new Date(session.user.updatedAt),
      }
    : null;

  // Only block UI while loading if user might be authenticated (has stored token).
  // Non-authenticated visitors see the welcome screen immediately instead of
  // waiting for the Neon DB session check to complete.
  const isLoading = isPending && (!checkedStorage || !!token);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        token,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
