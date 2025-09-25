"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/use-toast";
import { socialProviders, getProviderById } from "./SocialProviders";

interface SocialAuthDropdownProps {
  callbackURL?: string;
  errorCallbackURL?: string;
  newUserCallbackURL?: string;
  providers?: string[];
  placeholder?: string;
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  onProviderChange?: (providerId: string) => void;
  autoAuth?: boolean; // If true, auth immediately when provider is selected
}

export default function SocialAuthDropdown({
  callbackURL = "/pay",
  errorCallbackURL = "/error",
  newUserCallbackURL,
  providers,
  placeholder = "Select authentication provider",
  size = "default",
  disabled = false,
  onProviderChange,
  autoAuth = false
}: SocialAuthDropdownProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const providersToShow = providers 
    ? socialProviders.filter(p => providers.includes(p.id))
    : socialProviders;

  const handleProviderSelect = async (providerId: string) => {
    setSelectedProvider(providerId);
    onProviderChange?.(providerId);

    if (autoAuth) {
      await handleAuth(providerId);
    }
  };

  const handleAuth = async (providerId?: string) => {
    const providerToUse = providerId || selectedProvider;
    
    if (!providerToUse) {
      toast({
        variant: "destructive",
        title: "No Provider Selected",
        description: "Please select an authentication provider first.",
      });
      return;
    }

    const provider = getProviderById(providerToUse);
    if (!provider) return;

    setIsLoading(true);

    try {
      await authClient.signIn.social({
        provider: providerToUse as any,
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

  const selectedProviderData = getProviderById(selectedProvider);

  return (
    <div className="space-y-3">
      <Select 
        value={selectedProvider} 
        onValueChange={handleProviderSelect}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {providersToShow.map((provider) => {
            const IconComponent = provider.icon;
            return (
              <SelectItem key={provider.id} value={provider.id}>
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span>{provider.name}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {!autoAuth && selectedProvider && (
        <Button
          onClick={() => handleAuth()}
          disabled={isLoading || disabled}
          size={size}
          className={`w-full ${selectedProviderData?.color} ${selectedProviderData?.textColor}`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Authenticating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {selectedProviderData && <selectedProviderData.icon className="h-4 w-4" />}
              Sign in with {selectedProviderData?.name}
            </div>
          )}
        </Button>
      )}
    </div>
  );
}
