import { WalletSelector } from "./WalletSelector";
import Link from "next/link";
import { Button } from "./ui/button";
import { Send, CreditCard, Home } from "lucide-react";

export function Header() {
  return (
    <div className="flex items-center justify-between px-4 py-2 max-w-screen-xl mx-auto w-full flex-wrap">
      <h1 className="display">Muggam Works</h1>

      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/pay">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Money
            </Button>
          </Link>
          <Link href="/claim">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Claim Money
            </Button>
          </Link>
        </div>
        <WalletSelector />
      </div>
    </div>
  );
}
