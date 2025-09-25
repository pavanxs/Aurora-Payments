import { auth } from "@/lib/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";

console.log("🔧 Auth API route loaded");

export const { POST, GET } = toNextJsHandler(auth);