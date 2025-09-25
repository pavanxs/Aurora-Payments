"use client";

import { 
  Github, 
  Mail, 
  MessageCircle, 
  Twitter, 
  Facebook, 
  Apple, 
  Linkedin, 
  Music, 
  Twitch as TwitchIcon,
  Chrome,
  Figma
} from "lucide-react";

// Social provider configuration with icons and metadata
export const socialProviders = [
  {
    id: "github",
    name: "GitHub",
    icon: Github,
    color: "bg-gray-900 hover:bg-gray-800",
    textColor: "text-white",
    description: "Sign in with GitHub account"
  },
  {
    id: "google",
    name: "Google",
    icon: Chrome,
    color: "bg-red-500 hover:bg-red-600",
    textColor: "text-white",
    description: "Sign in with Google account"
  },
  {
    id: "discord",
    name: "Discord",
    icon: MessageCircle,
    color: "bg-indigo-500 hover:bg-indigo-600",
    textColor: "text-white",
    description: "Sign in with Discord account"
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: Twitter,
    color: "bg-blue-500 hover:bg-blue-600",
    textColor: "text-white",
    description: "Sign in with Twitter account"
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "bg-blue-600 hover:bg-blue-700",
    textColor: "text-white",
    description: "Sign in with Facebook account"
  },
  {
    id: "apple",
    name: "Apple",
    icon: Apple,
    color: "bg-black hover:bg-gray-800",
    textColor: "text-white",
    description: "Sign in with Apple ID"
  },
  {
    id: "microsoft",
    name: "Microsoft",
    icon: Mail,
    color: "bg-blue-500 hover:bg-blue-600",
    textColor: "text-white",
    description: "Sign in with Microsoft account"
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "bg-blue-700 hover:bg-blue-800",
    textColor: "text-white",
    description: "Sign in with LinkedIn account"
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: Music,
    color: "bg-green-500 hover:bg-green-600",
    textColor: "text-white",
    description: "Sign in with Spotify account"
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: TwitchIcon,
    color: "bg-purple-500 hover:bg-purple-600",
    textColor: "text-white",
    description: "Sign in with Twitch account"
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: MessageCircle,
    color: "bg-orange-500 hover:bg-orange-600",
    textColor: "text-white",
    description: "Sign in with Reddit account"
  },
  {
    id: "figma",
    name: "Figma",
    icon: Figma,
    color: "bg-purple-600 hover:bg-purple-700",
    textColor: "text-white",
    description: "Sign in with Figma account"
  }
];

// Get provider by ID
export const getProviderById = (id: string) => {
  return socialProviders.find(provider => provider.id === id);
};

// Get all provider IDs
export const getProviderIds = () => {
  return socialProviders.map(provider => provider.id);
};

// Provider categories for better organization
export const providerCategories = {
  development: ["github", "figma"],
  social: ["twitter", "facebook", "discord", "reddit"],
  professional: ["linkedin", "microsoft"],
  entertainment: ["spotify", "twitch"],
  tech: ["google", "apple"]
};
