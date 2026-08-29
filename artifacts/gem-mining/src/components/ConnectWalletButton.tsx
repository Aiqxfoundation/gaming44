import React from "react";
import { motion } from "framer-motion";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { useWeb3Wallet, shortenAddress } from "@/lib/web3Wallet";
import { notify } from "@/lib/notify";

/**
 * Connect / disconnect an injected Web3 wallet (MetaMask).
 * Shows the connected address once linked.
 */
export function ConnectWalletButton({ compact = false }: { compact?: boolean }) {
  const { address, isConnecting, hasProvider, connect, disconnect } = useWeb3Wallet();

  const handleConnect = async () => {
    if (!hasProvider) {
      notify.error("No Wallet Found", "Install MetaMask or another Web3 wallet to connect.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    const addr = await connect();
    if (addr) notify.success("Wallet Connected", shortenAddress(addr));
  };

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 h-10 rounded-xl border border-emerald-500/30"
          style={{ background: "rgba(16,185,129,0.08)" }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-emerald-400">
            {shortenAddress(address)}
          </span>
        </div>
        <button
          onClick={disconnect}
          title="Disconnect wallet"
          className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-500/30 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-xs hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-60"
    >
      {isConnecting ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Wallet size={15} />
      )}
      {compact ? "Connect" : "Connect Wallet"}
    </motion.button>
  );
}
