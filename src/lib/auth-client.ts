import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    fetchOptions: {
        onError: (e) => {
            console.error("🔥 Auth client error:", e);
            console.error("Error details:", {
                message: e.error?.message,
                status: e.response?.status,
                url: e.request?.url
            });
        },
        onRequest: (context) => {
            console.log("🔄 Auth request:", context.request?.url);
        },
        onResponse: (context) => {
            console.log("✅ Auth response:", context.response?.status);
        }
    }
})  

// Export social sign in functions for all providers
export const signInWithSocial = async (provider: string, callbackURL?: string) => {
    try {
        console.log(`Attempting ${provider} sign in...`);
        const data = await authClient.signIn.social({
            provider: provider as any,
            callbackURL: callbackURL || "/claim"
        });
        console.log(`${provider} sign in data:`, data);
        return data;
    } catch (error: any) {
        console.error(`${provider} sign in error:`, error);

        // Provide more helpful error messages
        if (error?.message?.includes("Cannot read properties of undefined")) {
            throw new Error(`${provider} authentication configuration error. Please check your environment variables and restart the development server.`);
        }

        if (error?.message?.includes("fetch")) {
            throw new Error("Network error. Please check your internet connection and try again.");
        }

        throw error;
    }
}

// Legacy GitHub function for backwards compatibility
export const signInWithGitHub = async (callbackURL?: string) => {
    return signInWithSocial("github", callbackURL);
}

