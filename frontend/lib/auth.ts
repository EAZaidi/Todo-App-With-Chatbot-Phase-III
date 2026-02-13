/**
 * Better Auth server configuration.
 *
 * Configures Better Auth with:
 * - PostgreSQL database (Neon)
 * - Email/password authentication
 * - JWT plugin with RS256 algorithm
 */

import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  database: pool,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [
    jwt({
      jwks: {
        keyPairConfig: {
          alg: "RS256",
        },
      },
      jwt: {
        expirationTime: "24h", // 24 hours
      },
    }),
  ],
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:8000",
    "https://essaabbas-todo-app-with-chatbot-phase-3.hf.space",
    "https://todo-app-with-chatbot-xi.vercel.app",
    process.env.BETTER_AUTH_URL || "http://localhost:3003",
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
