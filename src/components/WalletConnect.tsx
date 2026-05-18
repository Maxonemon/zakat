"use client";

import { useState, useEffect } from "react";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";

export default function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts.length > 0) setAddress(accounts[0]);
      });
    }
  }, []);

  const connect = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const client = createWalletClient({
          chain: sepolia,
          transport: custom(window.ethereum)
        });
        const [account] = await client.requestAddresses();
        setAddress(account);
      } catch (err) {
        console.error("Failed to connect wallet", err);
      }
    } else {
      alert("Please install MetaMask to secure transactions.");
    }
  };

  if (address) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-minimal bg-white px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#346538]"></span>
        <span className="text-[11px] font-mono text-[#111111] font-medium tracking-wide">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="rounded-md bg-[#111111] px-4 py-2 text-[12px] font-medium text-white transition-transform hover:scale-[0.98]"
    >
      Connect System
    </button>
  );
}
