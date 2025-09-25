"use client";

import { socialProviders, providerCategories } from "./SocialProviders";
import SocialAuthButton from "./SocialAuthButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SocialAuthGridProps {
  callbackURL?: string;
  errorCallbackURL?: string;
  newUserCallbackURL?: string;
  providers?: string[];
  showCategories?: boolean;
  columns?: 1 | 2 | 3 | 4;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

export default function SocialAuthGrid({
  callbackURL = "/pay",
  errorCallbackURL = "/error",
  newUserCallbackURL,
  providers,
  showCategories = false,
  columns = 2,
  size = "default",
  variant = "outline"
}: SocialAuthGridProps) {
  const providersToShow = providers 
    ? socialProviders.filter(p => providers.includes(p.id))
    : socialProviders;

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4"
  };

  if (showCategories) {
    return (
      <div className="space-y-6">
        {Object.entries(providerCategories).map(([category, categoryProviders]) => {
          const categoryProvidersToShow = providersToShow.filter(p => 
            categoryProviders.includes(p.id)
          );

          if (categoryProvidersToShow.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid ${gridCols[columns]} gap-3`}>
                  {categoryProvidersToShow.map((provider) => (
                    <SocialAuthButton
                      key={provider.id}
                      providerId={provider.id}
                      callbackURL={callbackURL}
                      errorCallbackURL={errorCallbackURL}
                      newUserCallbackURL={newUserCallbackURL}
                      size={size}
                      variant={variant}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-3`}>
      {providersToShow.map((provider) => (
        <SocialAuthButton
          key={provider.id}
          providerId={provider.id}
          callbackURL={callbackURL}
          errorCallbackURL={errorCallbackURL}
          newUserCallbackURL={newUserCallbackURL}
          size={size}
          variant={variant}
        />
      ))}
    </div>
  );
}
