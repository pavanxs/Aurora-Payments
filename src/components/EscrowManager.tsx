"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, Send, CreditCard, Eye, CheckCircle, XCircle } from "lucide-react";
import { surfClient } from "@/utils/surfClient";
import { AccountAddress, U64 } from "@thalalabs/surf";
import { aptosClient } from "@/utils/aptosClient";
import { MODULE_ADDRESS } from "@/constants";

interface TransactionRecord {
  sender: string;
  amount: string;
  status: number;
  tx_id: string;
}

export function EscrowManager() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form states
  const [sendAmount, setSendAmount] = useState<string>("");
  const [claimTxId, setClaimTxId] = useState<string>("");
  const [claimDestination, setClaimDestination] = useState<string>("");
  const [escrowOwner, setEscrowOwner] = useState<string>("");

  const surf = surfClient();

  useEffect(() => {
    if (connected && account) {
      checkInitialization();
      loadTransactions();
    }
  }, [connected, account]);

  const checkInitialization = async () => {
    if (!account) return;

    try {
      const result = await aptosClient().account.getAccountResource({
        accountAddress: account.address,
        resourceType: `${MODULE_ADDRESS}::PaymentEscrow::EscrowStore`
      });

      setIsInitialized(!!result);
      if (result) {
        setEscrowOwner(account.address);
      }
    } catch (error) {
      setIsInitialized(false);
    }
  };

  const loadTransactions = async () => {
    if (!escrowOwner) return;

    try {
      const result = await aptosClient().view({
        payload: {
          function: `${MODULE_ADDRESS}::PaymentEscrow::get_all_transactions`,
          typeArguments: [],
          functionArguments: [escrowOwner],
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

  const initializeEscrow = async () => {
    if (!account) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::PaymentEscrow::init`,
          typeArguments: [],
          functionArguments: [],
        },
      });

      await aptosClient().waitForTransaction({ transactionHash: response.hash });
      setIsInitialized(true);
      setSuccess("Escrow initialized successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to initialize escrow");
    } finally {
      setLoading(false);
    }
  };

  const sendMoney = async () => {
    if (!account || !sendAmount) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const amount = parseInt(sendAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount");
      }

      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::PaymentEscrow::send_money`,
          typeArguments: [],
          functionArguments: [amount],
        },
      });

      await aptosClient().waitForTransaction({ transactionHash: response.hash });
      setSuccess(`Successfully sent ${amount} APT to escrow!`);
      setSendAmount("");
      loadTransactions();
    } catch (err: any) {
      setError(err.message || "Failed to send money to escrow");
    } finally {
      setLoading(false);
    }
  };

  const claimMoney = async () => {
    if (!account || !claimTxId || !claimDestination || !escrowOwner) return;

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
      loadTransactions();
    } catch (err: any) {
      setError(err.message || "Failed to claim money from escrow");
    } finally {
      setLoading(false);
    }
  };

  const getTransactionStatus = async (txId: number) => {
    if (!escrowOwner) return null;

    try {
      const result = await aptosClient().view({
        payload: {
          function: `${MODULE_ADDRESS}::PaymentEscrow::get_transaction_status`,
          typeArguments: [],
          functionArguments: [escrowOwner, txId],
        },
      });

      return result[0] as number;
    } catch (error) {
      console.error("Error getting transaction status:", error);
      return null;
    }
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

  if (!connected) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payment Escrow Manager
          </CardTitle>
          <CardDescription>
            Connect your wallet to interact with the payment escrow contract
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Escrow Manager
        </CardTitle>
        <CardDescription>
          Send money to escrow and claim funds with off-chain validation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Initialization Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Escrow Status:</span>
            <span className="text-xs text-gray-500">(One-time setup per account)</span>
            {isInitialized === null ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isInitialized ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Initialized</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Not Initialized (Click "Initialize Escrow")</span>
              </div>
            )}
          </div>
          {!isInitialized && (
            <Button onClick={initializeEscrow} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initialize Escrow"}
            </Button>
          )}
        </div>

        <Separator />

        {/* Send Money Form */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <h3 className="text-lg font-semibold">Send Money to Escrow</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (APT)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={sendMoney}
                disabled={loading || !sendAmount}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send to Escrow"}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Claim Money Form */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <h3 className="text-lg font-semibold">Claim Money from Escrow</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="escrow-owner">Escrow Owner Address</Label>
                <Input
                  id="escrow-owner"
                  placeholder="0x..."
                  value={escrowOwner}
                  onChange={(e) => setEscrowOwner(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-id">Transaction ID</Label>
                <Input
                  id="tx-id"
                  type="number"
                  placeholder="0"
                  value={claimTxId}
                  onChange={(e) => setClaimTxId(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination Address</Label>
              <Input
                id="destination"
                placeholder="0x..."
                value={claimDestination}
                onChange={(e) => setClaimDestination(e.target.value)}
              />
            </div>

            <Button
              onClick={claimMoney}
              disabled={loading || !claimTxId || !claimDestination || !escrowOwner}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim Funds"}
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* Transaction History */}
        {transactions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Transaction History</h3>
              <div className="space-y-2">
                {transactions.map((tx, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="text-sm font-mono">{tx.tx_id}</div>
                      <div className="text-xs text-gray-500">From: {tx.sender}</div>
                      <div className="text-xs text-gray-500">Amount: {tx.amount} APT</div>
                    </div>
                    {getStatusBadge(tx.status)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
