# Social Authentication Setup Guide

This guide helps you configure all social authentication providers for your Aptos Push application using Better Auth.

## Overview

The application supports the following social authentication providers:
- GitHub
- Google
- Discord
- Twitter
- Facebook
- Apple
- Microsoft
- LinkedIn
- Spotify
- Twitch
- Reddit
- Figma

## Environment Variables

Copy the following environment variables to your `.env.local` file:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/aptos_push"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-super-secret-key-here-make-it-long-and-random"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Social Authentication Providers
# Get these from your OAuth app configurations

# GitHub OAuth
GITHUB_CLIENT_ID="your_github_client_id_here"
GITHUB_CLIENT_SECRET="your_github_client_secret_here"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"

# Discord OAuth
DISCORD_CLIENT_ID="your_discord_client_id_here"
DISCORD_CLIENT_SECRET="your_discord_client_secret_here"

# Twitter OAuth
TWITTER_CLIENT_ID="your_twitter_client_id_here"
TWITTER_CLIENT_SECRET="your_twitter_client_secret_here"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your_facebook_client_id_here"
FACEBOOK_CLIENT_SECRET="your_facebook_client_secret_here"

# Apple OAuth
APPLE_CLIENT_ID="your_apple_client_id_here"
APPLE_CLIENT_SECRET="your_apple_client_secret_here"

# Microsoft OAuth
MICROSOFT_CLIENT_ID="your_microsoft_client_id_here"
MICROSOFT_CLIENT_SECRET="your_microsoft_client_secret_here"

# LinkedIn OAuth
LINKEDIN_CLIENT_ID="your_linkedin_client_id_here"
LINKEDIN_CLIENT_SECRET="your_linkedin_client_secret_here"

# Spotify OAuth
SPOTIFY_CLIENT_ID="your_spotify_client_id_here"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret_here"

# Twitch OAuth
TWITCH_CLIENT_ID="your_twitch_client_id_here"
TWITCH_CLIENT_SECRET="your_twitch_client_secret_here"

# Reddit OAuth
REDDIT_CLIENT_ID="your_reddit_client_id_here"
REDDIT_CLIENT_SECRET="your_reddit_client_secret_here"

# Figma OAuth
FIGMA_CLIENT_ID="your_figma_client_id_here"
FIGMA_CLIENT_SECRET="your_figma_client_secret_here"

# Aptos Configuration
MODULE_ADDRESS="0x28cf259696b0daed4e12ea033a190cef6276c4ca412b615afeff787f4497ef11"
```

## Provider Setup Instructions

### 1. GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: "Aptos Push"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret to your `.env.local`

### 2. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure:
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret

### 3. Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to "OAuth2" tab
4. Add redirect URL: `http://localhost:3000/api/auth/callback/discord`
5. Copy the Client ID and Client Secret

### 4. Twitter OAuth

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app
3. Go to "Authentication settings"
4. Enable OAuth 2.0
5. Add callback URL: `http://localhost:3000/api/auth/callback/twitter`
6. Copy the Client ID and Client Secret

### 5. Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Configure redirect URI: `http://localhost:3000/api/auth/callback/facebook`
5. Copy the App ID and App Secret

### 6. Apple OAuth

1. Go to [Apple Developer](https://developer.apple.com/account/)
2. Create a new identifier for "Sign In with Apple"
3. Configure redirect URI: `http://localhost:3000/api/auth/callback/apple`
4. Copy the Client ID and generate a Client Secret

### 7. Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add redirect URI: `http://localhost:3000/api/auth/callback/microsoft`
4. Copy the Application (client) ID and create a Client Secret

### 8. LinkedIn OAuth

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add redirect URL: `http://localhost:3000/api/auth/callback/linkedin`
4. Copy the Client ID and Client Secret

### 9. Spotify OAuth

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
4. Copy the Client ID and Client Secret

### 10. Twitch OAuth

1. Go to [Twitch Developers](https://dev.twitch.tv/console/apps)
2. Register a new application
3. Add redirect URL: `http://localhost:3000/api/auth/callback/twitch`
4. Copy the Client ID and Client Secret

### 11. Reddit OAuth

1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Create a new app (web app)
3. Set redirect URI: `http://localhost:3000/api/auth/callback/reddit`
4. Copy the Client ID and Client Secret

### 12. Figma OAuth

1. Go to [Figma Developers](https://www.figma.com/developers/api)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/auth/callback/figma`
4. Copy the Client ID and Client Secret

## Production Configuration

For production deployment, update the following:

1. Change `NEXT_PUBLIC_BETTER_AUTH_URL` to your production domain
2. Update all OAuth callback URLs to use your production domain
3. Generate a strong `BETTER_AUTH_SECRET` (use a password generator)
4. Use environment variables in your hosting platform (Vercel, Netlify, etc.)

## Testing Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/pay`
3. Try the "Claim from Escrow" tab
4. Select any configured social provider from the dropdown
5. Complete the OAuth flow

## Troubleshooting

### Common Issues:

1. **"Provider not configured" error**: Make sure the environment variables are set correctly
2. **Redirect URI mismatch**: Ensure callback URLs match exactly in your OAuth app settings
3. **Invalid client credentials**: Double-check your Client ID and Client Secret
4. **CORS errors**: Make sure your domain is whitelisted in the OAuth app settings

### Debug Mode:

The auth configuration includes logging. Check your console for detailed error messages during authentication.

## Security Notes

- Never commit your `.env.local` file to version control
- Use strong, unique secrets for production
- Regularly rotate your OAuth app secrets
- Monitor your OAuth app usage for suspicious activity
- Use HTTPS in production for all redirect URIs

## Components Usage

The social auth system includes several reusable components:

### SocialAuthDropdown
```tsx
import { SocialAuthDropdown } from "@/components/auth";

<SocialAuthDropdown
  callbackURL="/dashboard"
  placeholder="Choose provider"
  providers={["github", "google", "discord"]} // Optional: limit providers
/>
```

### SocialAuthGrid
```tsx
import { SocialAuthGrid } from "@/components/auth";

<SocialAuthGrid
  callbackURL="/dashboard"
  columns={3}
  showCategories={true}
  providers={["github", "google", "discord"]} // Optional: limit providers
/>
```

### Individual Auth Buttons
```tsx
import { SocialAuthButton } from "@/components/auth";

<SocialAuthButton
  providerId="github"
  callbackURL="/dashboard"
  size="lg"
/>
```

## Additional Resources

- [Better Auth Documentation](https://www.better-auth.com/)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Security Best Practices for OAuth](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
