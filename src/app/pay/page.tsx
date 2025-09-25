"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWalletClient } from "@thalalabs/surf/hooks";
import { toast } from "@/components/ui/use-toast";
import { aptosClient } from "@/utils/aptosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Send, Wallet, Github, Loader2 } from "lucide-react";
import Link from "next/link";
import { getAccountAPTBalance } from "@/view-functions/getAccountBalance";
import { COIN_ABI } from "@/utils/coin_abi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";

export default function PayPage() {
  const { account } = useWallet();
  const { client } = useWalletClient();
  const queryClient = useQueryClient();


  // State for send mode
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("github");
  const [providerUserId, setProviderUserId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Authentication state (only used for claiming)
  const [authUser, setAuthUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check authentication status on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const session = await authClient.getSession();
        if (session.data?.user) {
          setAuthUser(session.data.user);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };
    checkAuthStatus();
  }, []);

  const handleGitHubAuth = async () => {
    setIsAuthenticating(true);

    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/pay"
      });

      toast({
        title: "Authentication Initiated",
        description: "Redirecting to GitHub for authentication...",
      });
    } catch (error: any) {
      console.error("GitHub auth error:", error);

      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error?.message || "Failed to initiate GitHub authentication. Please check your environment configuration.",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      setAuthUser(null);
      toast({
        title: "Signed Out",
        description: "Successfully signed out of your account",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out",
      });
    }
  };

  const { data } = useQuery({
    queryKey: ["apt-balance", account?.address],
    refetchInterval: 10_000,
    queryFn: async () => {
      try {
        if (!account) return { balance: 0 };
        const balance = await getAccountAPTBalance({ accountAddress: account.address.toStringLong() });
        return { balance };
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch balance",
        });
        return { balance: 0 };
      }
    },
  });

  const aptBalance = data?.balance || 0;
  const balanceInAPT = aptBalance / Math.pow(10, 8);

  const handleTransfer = async () => {
    if (!client || !transferAmount || !providerUserId.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please specify amount and recipient handle",
      });
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount",
      });
      return;
    }

    if (amount > balanceInAPT) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "You don't have enough APT for this transfer",
      });
      return;
    }

    setIsLoading(true);

    try {
      const escrowAddress = "0x28cf259696b0daed4e12ea033a190cef6276c4ca412b615afeff787f4497ef11";
      const amountInOctas = Math.pow(10, 8) * amount;

      // Call the new deposit_payment function
      const committedTransaction = await client.submitTransaction({
        sender: account!.address,
        data: {
          function: `${MODULE_ADDRESS}::PaymentEscrow::deposit_payment`,
          typeArguments: [],
          functionArguments: [
            escrowAddress,
            selectedProvider,
            providerUserId.trim(),
            amountInOctas
          ],
        },
      });

      await aptosClient().waitForTransaction({
        transactionHash: committedTransaction.hash,
      });

      // Store metadata in database
      try {
        const response = await fetch('/api/escrow/deposit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            escrowAddress,
            transactionHash: committedTransaction.hash,
            provider: selectedProvider,
            providerUserId: providerUserId.trim(),
            senderAddress: account!.address.toString(),
            amount: amountInOctas.toString(),
            message: message.trim() || null
          })
        });

        if (!response.ok) {
          console.warn('Failed to store payment metadata:', await response.text());
        }
      } catch (dbError) {
        console.warn('Database storage failed:', dbError);
        // Don't fail the whole transaction for DB issues
      }

      queryClient.invalidateQueries({
        queryKey: ["apt-balance", account?.address],
      });

      toast({
        title: "Payment Sent Successfully!",
        description: `Sent ${amount} APT to ${selectedProvider} user: ${providerUserId}`,
      });

      // Clear form
      setTransferAmount("");
      setProviderUserId("");
      setMessage("");

    } catch (error: any) {
      console.error("Transfer error:", error);
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: error.message || "Transaction failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle claim function for claim mode
  const handleClaim = async () => {
    if (!client) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please connect your wallet",
      });
      return;
    }

    setIsLoading(true);

    try {
      // First authenticate with GitHub if not already authenticated
      if (!authUser) {
        await handleGitHubAuth();
        return; // Exit early after auth redirect
      }

      // Perform claim logic here - redirect to claim page or implement claim functionality
      toast({
        title: "Authentication Successful",
        description: "Redirecting to claim page...",
      });

      // Redirect to claim page after successful authentication
      window.location.href = "/claim";

    } catch (error: any) {
      console.error("Claim error:", error);
      toast({
        variant: "destructive",
        title: "Claim Failed",
        description: error.message || "Claim transaction failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Connect Wallet</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Please connect your wallet to send money
              </p>
              <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Escrow Payment System</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>How it works:</strong> Send APT to the escrow account for secure holding.
                Funds can only be claimed by authenticated users through the Claim section.
              </p>
            </div>

            <Tabs defaultValue="send" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="send" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Deposit to Escrow
                </TabsTrigger>
                <TabsTrigger value="claim" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Claim from Escrow
                </TabsTrigger>
              </TabsList>

              <TabsContent value="send" className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="balance">Your Balance</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">APT</span>
                      <span className="font-mono font-medium">{balanceInAPT.toFixed(8)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="provider">Platform</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">
                        <div className="flex items-center gap-2">
                          <Github className="h-4 w-4" />
                          GitHub
                        </div>
                      </SelectItem>
                      <SelectItem value="discord">
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 text-blue-500">💬</span>
                          Discord
                        </div>
                      </SelectItem>
                      <SelectItem value="figma">
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 text-purple-500">🎨</span>
                          Figma
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Platform where the recipient can be found
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient-handle">
                    {selectedProvider === 'github' && 'GitHub Username'}
                    {selectedProvider === 'discord' && 'Discord User ID'}
                    {selectedProvider === 'figma' && 'Figma Email'}
                  </Label>
                  <Input
                    id="recipient-handle"
                    type="text"
                    placeholder={
                      selectedProvider === 'github' ? 'username' :
                      selectedProvider === 'discord' ? '123456789012345678' :
                      'user@example.com'
                    }
                    value={providerUserId}
                    onChange={(e) => setProviderUserId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedProvider === 'github' && 'GitHub username (without @)'}
                    {selectedProvider === 'discord' && 'Discord user ID (18-digit number)'}
                    {selectedProvider === 'figma' && 'Email associated with Figma account'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (APT)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum: 0.00000001 APT
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Payment for work completed..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional message for the recipient
                  </p>
                </div>

                <Button
                  onClick={handleTransfer}
                  disabled={isLoading || !transferAmount || !providerUserId.trim() || parseFloat(transferAmount) <= 0 || parseFloat(transferAmount) > balanceInAPT}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending Payment...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send {transferAmount ? `${transferAmount} APT` : "Payment"} 
                      {providerUserId && ` to ${providerUserId}`}
                    </div>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="claim" className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="balance">Your Balance</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">APT</span>
                      <span className="font-mono font-medium">{balanceInAPT.toFixed(8)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* GitHub Authentication Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    <h3 className="text-lg font-semibold">GitHub Authentication</h3>
                  </div>

                  {authUser ? (
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Github className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-200">
                              Authenticated as {authUser.name || authUser.email}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              GitHub account verified
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSignOut}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Sign in with GitHub to claim funds securely
                      </p>

                      <Button
                        onClick={handleGitHubAuth}
                        disabled={isAuthenticating}
                        className="w-full"
                        size="lg"
                      >
                        {isAuthenticating ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Authenticating with GitHub...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Github className="h-4 w-4" />
                            Sign in with GitHub
                          </div>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleClaim}
                  disabled={isLoading || !authUser}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Claiming...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Go to Claim Page
                    </div>
                  )}
                </Button>
              </TabsContent>

              <div className="text-xs text-muted-foreground text-center mt-6">
                <p>Transaction fees will be deducted from your balance</p>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

