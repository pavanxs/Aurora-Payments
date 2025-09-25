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
import { Loader2, Wallet, CreditCard, Eye, ArrowLeft, CheckCircle, XCircle, Github } from "lucide-react";
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

  // Form states
  const [escrowOwner, setEscrowOwner] = useState<string>("");
  const [claimTxId, setClaimTxId] = useState<string>("");
  const [claimDestination, setClaimDestination] = useState<string>("");
  
  // Auth states
  const [authUser, setAuthUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
    if (!account || !claimTxId || !claimDestination || !escrowOwner) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const txId = parseInt(claimTxId);
      if (isNaN(txId) || txId < 0) {
        throw new Error("Invalid transaction ID");
      }

      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::PaymentEscrow::claim_money`,
          typeArguments: [],
          functionArguments: [escrowOwner, txId, claimDestination],
        },
      });

      await aptosClient().waitForTransaction({ transactionHash: response.hash });
      setSuccess(`Successfully claimed funds to ${claimDestination}!`);
      setClaimTxId("");
      setClaimDestination("");

      // Reload transactions
      if (escrowOwner) {
        await loadTransactions(escrowOwner);
      }
    } catch (err: any) {
      setError(err.message || "Failed to claim money from escrow");
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

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="escrow-owner">Escrow Owner Address</Label>
                <Input
                  id="escrow-owner"
                  placeholder="0x1..."
                  value={escrowOwner}
                  onChange={(e) => setEscrowOwner(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Address of the person who set up the escrow (usually the client or employer)
                </p>
              </div>

              <Button
                onClick={handleLoadTransactions}
                variant="outline"
                className="w-full"
                disabled={!escrowOwner}
              >
                Load Available Transactions
              </Button>
            </div>

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
