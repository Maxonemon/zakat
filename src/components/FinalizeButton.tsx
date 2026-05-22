"use client";

import { useState } from "react";
import { createWalletClient, custom, stringToHex, pad } from "viem";
import { sepolia } from "viem/chains";
import { ZakatAuditLogABI } from "@/lib/abi";
import { finalizePayrollRun } from "@/app/actions";

type Props = {
  payrollRunId: string;
  disabled: boolean;
};

export default function FinalizeButton({ payrollRunId, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    setLoading(true);
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        alert("Please install MetaMask to secure this transaction.");
        setLoading(false);
        return;
      }
      
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
      if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
        alert("Please deploy the contract and set NEXT_PUBLIC_CONTRACT_ADDRESS in .env");
        setLoading(false);
        return;
      }

      // Request user to switch to Sepolia BEFORE doing anything else
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        console.error("Failed to switch to Sepolia:", switchError);
        alert("Please switch your MetaMask network to Sepolia to continue.");
        setLoading(false);
        return;
      }

      const client = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum)
      });
      
      const accounts = await client.requestAddresses();
      const account = accounts[0];
      
      const payload = JSON.stringify({ type: "PAYROLL_RUN_FINALIZED", payrollRunId });
      const prevHash = pad("0x0", { size: 32 }); 
      
      // 1. Wait for MetaMask signature and transaction submission
      await client.writeContract({
        address: contractAddress,
        abi: ZakatAuditLogABI,
        functionName: "append",
        args: [prevHash, stringToHex(payload)],
        account,
      });
      
      // 2. ONLY proceed to update database if the Web3 transaction succeeded
      const formData = new FormData();
      formData.append("payrollRunId", payrollRunId);
      await finalizePayrollRun(formData);
      
    } catch (err) {
      console.error("Verification Failed:", err);
      alert("System verification failed. Ensure you are connected properly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleFinalize}>
      <button
        type="submit"
        disabled={disabled || loading}
        className="rounded-md bg-[#111111] px-4 py-2 text-[12px] font-medium text-white transition-transform hover:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
      >
        {loading ? "Verifying..." : "Finalize Period"}
      </button>
    </form>
  );
}
