import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../index";
import * as schema from "../db/schema";

console.log("🔧 Initializing Better Auth...");
console.log("Database URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ Missing");

// Log all social provider configurations
const providers = [
    'GITHUB', 'GOOGLE', 'DISCORD', 'TWITTER', 'FACEBOOK', 'APPLE', 
    'MICROSOFT', 'LINKEDIN', 'SPOTIFY', 'TWITCH', 'REDDIT', 'FIGMA'
];

providers.forEach(provider => {
    const clientId = process.env[`${provider}_CLIENT_ID`];
    const clientSecret = process.env[`${provider}_CLIENT_SECRET`];
    console.log(`${provider} Client ID:`, clientId ? "✅ Set" : "❌ Missing");
    console.log(`${provider} Client Secret:`, clientSecret ? "✅ Set" : "❌ Missing");
});

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
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "your_google_client_id_here",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "your_google_client_secret_here",
        },
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID || "your_discord_client_id_here",
            clientSecret: process.env.DISCORD_CLIENT_SECRET || "your_discord_client_secret_here",
        },
        twitter: {
            clientId: process.env.TWITTER_CLIENT_ID || "your_twitter_client_id_here",
            clientSecret: process.env.TWITTER_CLIENT_SECRET || "your_twitter_client_secret_here",
        },
        facebook: {
            clientId: process.env.FACEBOOK_CLIENT_ID || "your_facebook_client_id_here",
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "your_facebook_client_secret_here",
        },
        apple: {
            clientId: process.env.APPLE_CLIENT_ID || "your_apple_client_id_here",
            clientSecret: process.env.APPLE_CLIENT_SECRET || "your_apple_client_secret_here",
        },
        microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID || "your_microsoft_client_id_here",
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "your_microsoft_client_secret_here",
        },
        linkedin: {
            clientId: process.env.LINKEDIN_CLIENT_ID || "your_linkedin_client_id_here",
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "your_linkedin_client_secret_here",
        },
        spotify: {
            clientId: process.env.SPOTIFY_CLIENT_ID || "your_spotify_client_id_here",
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "your_spotify_client_secret_here",
        },
        twitch: {
            clientId: process.env.TWITCH_CLIENT_ID || "your_twitch_client_id_here",
            clientSecret: process.env.TWITCH_CLIENT_SECRET || "your_twitch_client_secret_here",
        },
        reddit: {
            clientId: process.env.REDDIT_CLIENT_ID || "your_reddit_client_id_here",
            clientSecret: process.env.REDDIT_CLIENT_SECRET || "your_reddit_client_secret_here",
        },
        figma: {
            clientId: process.env.FIGMA_CLIENT_ID || "your_figma_client_id_here",
            clientSecret: process.env.FIGMA_CLIENT_SECRET || "your_figma_client_secret_here",
        },
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