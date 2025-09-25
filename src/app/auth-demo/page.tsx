"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { 
  SocialAuthButton, 
  SocialAuthGrid, 
  SocialAuthDropdown,
  socialProviders,
  providerCategories
} from "@/components/auth";

export default function AuthDemoPage() {
  const [selectedProviders, setSelectedProviders] = useState<string[]>([
    "github", "google", "discord", "twitter"
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Social Authentication Demo</CardTitle>
              <p className="text-muted-foreground">
                Comprehensive social sign-on integration with Better Auth
              </p>
            </CardHeader>
          </Card>

          <Tabs defaultValue="dropdown" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dropdown">Dropdown</TabsTrigger>
              <TabsTrigger value="grid">Grid Layout</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="individual">Individual</TabsTrigger>
            </TabsList>

            <TabsContent value="dropdown" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Social Auth Dropdown</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select from all available social providers in a dropdown format
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-w-md">
                    <SocialAuthDropdown
                      callbackURL="/auth-demo"
                      placeholder="Choose your authentication provider"
                      size="lg"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong>Supported providers:</strong>{" "}
                    {socialProviders.map(p => p.name).join(", ")}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grid" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Social Auth Grid</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    All social providers in a responsive grid layout
                  </p>
                </CardHeader>
                <CardContent>
                  <SocialAuthGrid
                    callbackURL="/auth-demo"
                    columns={3}
                    size="default"
                    variant="outline"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Categorized Social Auth</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Social providers organized by category
                  </p>
                </CardHeader>
                <CardContent>
                  <SocialAuthGrid
                    callbackURL="/auth-demo"
                    columns={2}
                    showCategories={true}
                    size="default"
                    variant="outline"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="individual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Individual Provider Buttons</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Showcase of individual social auth buttons with custom styling
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(providerCategories).map(([category, providers]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold capitalize">{category}</h3>
                        <Badge variant="secondary">{providers.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {providers.map(providerId => (
                          <SocialAuthButton
                            key={providerId}
                            providerId={providerId}
                            callbackURL="/auth-demo"
                            size="default"
                            variant="outline"
                          />
                        ))}
                      </div>
                      {category !== "tech" && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Configuration Status</CardTitle>
              <p className="text-sm text-muted-foreground">
                Check which social providers are properly configured
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {socialProviders.map(provider => {
                  const isConfigured = typeof window !== 'undefined' && 
                    process.env[`${provider.id.toUpperCase()}_CLIENT_ID`];
                  
                  return (
                    <div key={provider.id} className="flex items-center gap-2">
                      <provider.icon className="h-4 w-4" />
                      <span className="text-sm">{provider.name}</span>
                      <Badge variant={isConfigured ? "default" : "secondary"}>
                        {isConfigured ? "✓" : "⚠"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <p>
                  ✓ = Configured | ⚠ = Needs configuration
                </p>
                <p className="mt-2">
                  See <code>SOCIAL_AUTH_SETUP.md</code> for configuration instructions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
