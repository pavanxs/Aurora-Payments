"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/use-toast";
import { getProviderById } from "./SocialProviders";

interface SocialAuthButtonProps {
  providerId: string;
  callbackURL?: string;
  errorCallbackURL?: string;
  newUserCallbackURL?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function SocialAuthButton({
  providerId,
  callbackURL = "/pay",
  errorCallbackURL = "/error",
  newUserCallbackURL,
  size = "default",
  variant = "default",
  disabled = false,
  className = "",
  children
}: SocialAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const provider = getProviderById(providerId);

  if (!provider) {
    console.error(`Provider ${providerId} not found`);
    return null;
  }

  const handleAuth = async () => {
    setIsLoading(true);

    try {
      await authClient.signIn.social({
        provider: providerId as any,
        callbackURL,
        errorCallbackURL,
        newUserCallbackURL
      });

      toast({
        title: "Authentication Initiated",
        description: `Redirecting to ${provider.name} for authentication...`,
      });
    } catch (error: any) {
      console.error(`${provider.name} auth error:`, error);

      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error?.message || `Failed to initiate ${provider.name} authentication. Please check your configuration.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const IconComponent = provider.icon;

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoading || disabled}
      size={size}
      variant={variant}
      className={`${className} ${provider.color} ${provider.textColor}`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Authenticating...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4" />
          {children || `Sign in with ${provider.name}`}
        </div>
      )}
    </Button>
  );
}
