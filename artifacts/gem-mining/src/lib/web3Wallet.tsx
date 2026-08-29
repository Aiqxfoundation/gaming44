import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

// Minimal EIP-1193 provider typing (MetaMask / injected wallets).
interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

const STORAGE_KEY = "etr_web3_address";

interface Web3WalletState {
  address: string | null;
  chainId: string | null;
  isConnecting: boolean;
  hasProvider: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => void;
}

const Web3WalletContext = createContext<Web3WalletState | undefined>(undefined);

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function Web3WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const providerRef = useRef<Eip1193Provider | null>(null);

  const hasProvider = typeof window !== "undefined" && !!window.ethereum;

  // Restore a previously connected account and bind event listeners.
  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    providerRef.current = eth;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      eth.request({ method: "eth_accounts" })
        .then((accounts: unknown) => {
          const list = accounts as string[];
          if (list.length && list[0].toLowerCase() === saved.toLowerCase()) {
            setAddress(list[0]);
          } else if (!list.length) {
            localStorage.removeItem(STORAGE_KEY);
          }
        })
        .catch(() => {});
    }

    eth.request({ method: "eth_chainId" })
      .then((id: unknown) => setChainId(id as string))
      .catch(() => {});

    const handleAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[] | undefined;
      if (accounts && accounts.length) {
        setAddress(accounts[0]);
        localStorage.setItem(STORAGE_KEY, accounts[0]);
      } else {
        setAddress(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    const handleChain = (...args: unknown[]) => setChainId(args[0] as string);

    eth.on?.("accountsChanged", handleAccounts);
    eth.on?.("chainChanged", handleChain);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccounts);
      eth.removeListener?.("chainChanged", handleChain);
    };
  }, []);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return null;
    setIsConnecting(true);
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      if (accounts.length) {
        setAddress(accounts[0]);
        localStorage.setItem(STORAGE_KEY, accounts[0]);
        return accounts[0];
      }
      return null;
    } catch {
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <Web3WalletContext.Provider
      value={{ address, chainId, isConnecting, hasProvider, connect, disconnect }}
    >
      {children}
    </Web3WalletContext.Provider>
  );
}

export function useWeb3Wallet() {
  const ctx = useContext(Web3WalletContext);
  if (!ctx) throw new Error("useWeb3Wallet must be used within Web3WalletProvider");
  return ctx;
}

export { shortenAddress };
