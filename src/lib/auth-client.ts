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

// Export the sign in function for GitHub
export const signInWithGitHub = async (callbackURL?: string) => {
    try {
        console.log("Attempting GitHub sign in...");
        const data = await authClient.signIn.social({
            provider: "github",
            callbackURL: callbackURL || "/claim"
        });
        console.log("GitHub sign in data:", data);
        return data;
    } catch (error: any) {
        console.error("GitHub sign in error:", error);

        // Provide more helpful error messages
        if (error?.message?.includes("Cannot read properties of undefined")) {
            throw new Error("Authentication configuration error. Please check your environment variables and restart the development server.");
        }

        if (error?.message?.includes("fetch")) {
            throw new Error("Network error. Please check your internet connection and try again.");
        }

        throw error;
    }
}

