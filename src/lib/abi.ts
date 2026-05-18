export const ZakatAuditLogABI = [
  {
    type: "function",
    name: "append",
    inputs: [
      { name: "prevHash", type: "bytes32" },
      { name: "payload", type: "bytes" }
    ],
    outputs: [{ name: "index", type: "uint64" }],
    stateMutability: "nonpayable"
  }
] as const;
