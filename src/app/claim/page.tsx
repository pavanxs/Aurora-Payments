"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wallet, CreditCard, Eye, ArrowLeft, CheckCircle, XCircle, Github, RefreshCw } from "lucide-react";
import { surfClient } from "@/utils/surfClient";
import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface TransactionRecord {
  sender: string;
  amount: string;
  status: number;
  tx_id: string;
}

export default function ClaimPage() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [availablePayments, setAvailablePayments] = useState<any[]>([]);

  // Form states
  const [escrowAddress, setEscrowAddress] = useState<string>("0x28cf259696b0daed4e12ea033a190cef6276c4ca412b615afeff787f4497ef11");
  const [selectedProvider, setSelectedProvider] = useState<string>("github");
  const [claimTxId, setClaimTxId] = useState<string>("");
  const [claimDestination, setClaimDestination] = useState<string>("");
  
  // Auth states
  const [authUser, setAuthUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const surf = surfClient();

  // Check authentication status on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.user) {
          setAuthUser(session.user);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };
    checkAuthStatus();
  }, []);

  // Load available payments for authenticated user
  const loadAvailablePayments = async () => {
    if (!authUser || !escrowAddress) return;

    setLoadingPayments(true);
    try {
      const response = await fetch(
        `/api/escrow/claim?escrowAddress=${escrowAddress}&provider=${selectedProvider}`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailablePayments(data.payments || []);
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to load payments",
          description: errorData.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to server",
      });
    } finally {
      setLoadingPayments(false);
    }
  };

  // Auto-load payments when user authenticates
  useEffect(() => {
    if (authUser) {
      loadAvailablePayments();
    }
  }, [authUser, selectedProvider, escrowAddress]);

  const handleGitHubAuth = async () => {
    setIsAuthenticating(true);

    try {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/claim"
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

  const loadTransactions = async (ownerAddress: string) => {
    try {
      const result = await aptosClient().view({
        payload: {
          function: `${MODULE_ADDRESS}::PaymentEscrow::get_all_transactions`,
          typeArguments: [],
          functionArguments: [ownerAddress],
        },
      });

      const [senders, amounts, statuses, txIds] = result as [string[], string[], number[], number[]];
      const transactions: TransactionRecord[] = [];

      for (let i = 0; i < senders.length; i++) {
        transactions.push({
          sender: senders[i],
          amount: (parseInt(amounts[i]) / 100000000).toString(), // Convert to APT
          status: statuses[i],
          tx_id: txIds[i].toString(),
        });
      }

      setTransactions(transactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
      setTransactions([]);
    }
  };

  const claimMoney = async () => {
    if (!account || !claimTxId || !claimDestination || !authUser) {
      setError("Please fill in all required fields and authenticate");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const paymentId = parseInt(claimTxId);
      if (isNaN(paymentId) || paymentId < 0) {
        throw new Error("Invalid payment ID");
      }

      // First verify with backend API
      const verifyResponse = await fetch('/api/escrow/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowAddress,
          paymentId,
          provider: selectedProvider,
          recipientAddress: claimDestination
        })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const verificationData = await verifyResponse.json();

      // Submit blockchain transaction
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::PaymentEscrow::claim_payment`,
          typeArguments: [],
          functionArguments: [
            paymentId,
            selectedProvider,
            verificationData.verification.providerUserId,
            claimDestination
          ],
        },
      });

      await aptosClient().waitForTransaction({ transactionHash: response.hash });

      // Update backend with claim transaction
      await fetch('/api/escrow/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowAddress,
          paymentId,
          recipientAddress: claimDestination,
          claimTransactionHash: response.hash
        })
      });

      setSuccess(`Successfully claimed ${verificationData.verification.amount / 100000000} APT!`);
      setClaimTxId("");
      setClaimDestination("");

      // Reload available payments
      await loadAvailablePayments();

    } catch (err: any) {
      setError(err.message || "Failed to claim payment");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTransactions = async () => {
    if (!escrowOwner) {
      setError("Please enter an escrow owner address");
      return;
    }

    setError("");
    await loadTransactions(escrowOwner);
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="secondary">Pending</Badge>;
      case 1:
        return <Badge variant="default">Claimed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // TEMPORARILY DISABLED WALLET CHECK FOR TESTING
  // if (!connected) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
  //       <div className="max-w-md mx-auto">
  //         <Card>
  //           <CardHeader>
  //             <CardTitle className="text-center">Connect Wallet</CardTitle>
  //           </CardHeader>
  //           <CardContent className="text-center">
  //             <p className="text-muted-foreground mb-4">
  //               Please connect your wallet to claim money
  //             </p>
  //             <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
  //           </CardContent>
  //         </Card>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
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
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Claim Money from Escrow
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                Claim payments from completed work. Make sure you have the correct escrow owner address and transaction ID.
              </AlertDescription>
            </Alert>

            {/* Authentication Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Social Authentication</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-provider">Platform</Label>
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
              </div>

              {authUser ? (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedProvider === 'github' && <Github className="h-5 w-5 text-green-600" />}
                      {selectedProvider === 'discord' && <span className="h-5 w-5 text-blue-500">💬</span>}
                      {selectedProvider === 'figma' && <span className="h-5 w-5 text-purple-500">🎨</span>}
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          Authenticated as {authUser.name || authUser.email}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} account verified
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadAvailablePayments}
                        disabled={loadingPayments}
                      >
                        {loadingPayments ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
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
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Sign in with {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} to claim funds securely
                  </p>

                  <Button
                    onClick={() => {
                      if (selectedProvider === 'github') {
                        handleGitHubAuth();
                      } else {
                        toast({
                          variant: "destructive",
                          title: "Coming Soon",
                          description: `${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} authentication will be available soon.`,
                        });
                      }
                    }}
                    disabled={isAuthenticating}
                    className="w-full"
                    size="lg"
                  >
                    {isAuthenticating ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Authenticating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {selectedProvider === 'github' && <Github className="h-4 w-4" />}
                        {selectedProvider === 'discord' && <span className="h-4 w-4 text-blue-500">💬</span>}
                        {selectedProvider === 'figma' && <span className="h-4 w-4 text-purple-500">🎨</span>}
                        Sign in with {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Available Payments Section */}
            {authUser && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Available Payments</h3>
                  {availablePayments.length > 0 && (
                    <Badge variant="secondary">
                      {availablePayments.length} payment{availablePayments.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {loadingPayments ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading payments...
                    </div>
                  </div>
                ) : availablePayments.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availablePayments.map((payment, index) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono font-medium">ID: {payment.paymentId}</span>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>From: {payment.senderAddress.slice(0, 6)}...{payment.senderAddress.slice(-4)}</div>
                            <div>Amount: {(parseFloat(payment.amount) / 100000000).toFixed(8)} APT</div>
                            {payment.message && <div>Message: {payment.message}</div>}
                            <div>Created: {new Date(payment.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setClaimTxId(payment.paymentId.toString());
                            setClaimDestination(account?.address.toString() || "");
                          }}
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No pending payments found for your {selectedProvider} account.</p>
                    <p className="text-sm mt-2">Ask someone to send you a payment!</p>
                  </div>
                )}
              </div>
            )}

            {authUser && <Separator />}

            {transactions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Available Transactions</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {transactions.map((tx, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium">ID: {tx.tx_id}</span>
                            {getStatusBadge(tx.status)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            From: {tx.sender.slice(0, 6)}...{tx.sender.slice(-4)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Amount: {tx.amount} APT
                          </div>
                        </div>
                        {tx.status === 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setClaimTxId(tx.tx_id);
                              setClaimDestination(account?.address.toString() || "");
                            }}
                          >
                            Select
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Claim Funds</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="claim-tx-id">Transaction ID</Label>
                    <Input
                      id="claim-tx-id"
                      type="number"
                      placeholder="123"
                      value={claimTxId}
                      onChange={(e) => setClaimTxId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="claim-destination">Destination Address</Label>
                    <Input
                      id="claim-destination"
                      placeholder="0x1..."
                      value={claimDestination}
                      onChange={(e) => setClaimDestination(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <Button
                  onClick={claimMoney}
                  disabled={loading || !claimTxId || !claimDestination || !escrowOwner}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Claiming...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Claim {claimTxId ? `Transaction #${claimTxId}` : "Funds"}
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-muted-foreground text-center">
              <p>⚠️ Only claim funds that you are authorized to receive</p>
              <p>Make sure the escrow owner and transaction details are correct</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
