"use client";

import { AccountInfo } from "@/components/AccountInfo";
import { Header } from "@/components/Header";
import { MessageBoard } from "@/components/MessageBoard";
import { NetworkInfo } from "@/components/NetworkInfo";
import { TopBanner } from "@/components/TopBanner";
import { TransferAPT } from "@/components/TransferAPT";
import { WalletDetails } from "@/components/WalletDetails";
import { EscrowManager } from "@/components/EscrowManager";
// Internal Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Send, CreditCard } from "lucide-react";
import Link from "next/link";

function App() {
  const { connected } = useWallet();

  return (
    <>
    <TopBanner />
      <Header />
      <div className="flex items-center justify-center flex-col">
        {connected ? (
          <Card>
            <CardContent className="flex flex-col gap-10 pt-6">
              <WalletDetails />
              <NetworkInfo />
              <AccountInfo />

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/pay">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                        <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Send Money</h3>
                        <p className="text-sm text-muted-foreground">Transfer APT to another wallet</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/claim">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Claim Money</h3>
                        <p className="text-sm text-muted-foreground">Claim payments from escrow</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              <TransferAPT />
              <MessageBoard />
              <EscrowManager />
            </CardContent>
          </Card>
        ) : (
          <CardHeader>
            <CardTitle>To get started Connect a wallet</CardTitle>
          </CardHeader>
        )}
      </div>
    </>
  );
}

export default App;
