import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../index";
import * as schema from "../db/schema";

console.log("🔧 Initializing Better Auth...");
console.log("Database URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ Missing");
console.log("GitHub Client ID:", process.env.GITHUB_CLIENT_ID ? "✅ Set" : "❌ Missing");
console.log("GitHub Client Secret:", process.env.GITHUB_CLIENT_SECRET ? "✅ Set" : "❌ Missing");

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "your_github_client_id_here",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "your_github_client_secret_here",
        },
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID || "your_discord_client_id_here",
            clientSecret: process.env.DISCORD_CLIENT_SECRET || "your_discord_client_secret_here",
        },
        // Note: Figma OAuth is not natively supported by better-auth
        // We'll need to implement custom OAuth for Figma
    },
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    trustedOrigins: ["http://localhost:3000"],
    secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-key-for-development",
    logger: {
        disabled: false,
        log: (level, message) => {
            console.log(`[AUTH ${level.toUpperCase()}]`, message);
        }
    }
});